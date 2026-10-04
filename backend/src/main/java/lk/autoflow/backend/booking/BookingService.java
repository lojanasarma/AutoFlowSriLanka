package lk.autoflow.backend.booking;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;
import lk.autoflow.backend.vehicle.Vehicle;
import lk.autoflow.backend.vehicle.VehicleRepository;
import lk.autoflow.backend.user.Customer;
import org.springframework.security.core.Authentication;
import lk.autoflow.backend.notification.NotificationService;
import lk.autoflow.backend.notification.AuditLogService;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final lk.autoflow.backend.user.UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Optional<Booking> getBookingByRef(String ref) {
        return bookingRepository.findByRef(ref);
    }

    public List<Booking> getBookingsByCustomer(Integer customerId) {
        return bookingRepository.findByCustomer_UserId(customerId);
    }

    public List<Booking> getBookingsByCentre(Integer centreId) {
        return bookingRepository.findByCentre_CentreId(centreId);
    }

    @Transactional
    public Booking createBooking(Booking booking, String email, Authentication authentication) {
        boolean isCustomer = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
        Customer customer;
        if (isCustomer || booking.getCustomer() == null || booking.getCustomer().getUserId() == null) {
            customer = (Customer) userRepository.findByEmail(email).orElseThrow();
        } else {
            customer = userRepository.findById(booking.getCustomer().getUserId())
                    .filter(Customer.class::isInstance).map(Customer.class::cast)
                    .orElseThrow(() -> new IllegalArgumentException("Selected customer was not found"));
        }
        if (booking.getVehicle() == null || booking.getVehicle().getVehicleId() == null) {
            throw new IllegalArgumentException("Select a registered vehicle");
        }
        Vehicle vehicle = vehicleRepository.findById(booking.getVehicle().getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Selected vehicle was not found"));
        if (!"ACTIVE".equals(vehicle.getStatus()) || vehicle.getOwner() == null
                || !vehicle.getOwner().getUserId().equals(customer.getUserId())) {
            throw new IllegalArgumentException("Select an active vehicle registered to this customer");
        }
        LocalDate today = LocalDate.now();
        if (vehicle.getInsuranceExpiry() == null || vehicle.getInsuranceExpiry().isBefore(today)
                || vehicle.getDocuments().stream().anyMatch(document ->
                    document.getExpiryDate() == null || document.getExpiryDate().isBefore(today)
                            || !"VALID".equalsIgnoreCase(document.getStatus()))) {
            throw new IllegalArgumentException("Vehicle insurance or required documents have expired. Please renew them before booking.");
        }
        if (booking.getSlot() == null || booking.getSlot().getSlotId() == null) {
            throw new IllegalArgumentException("Select an available time slot");
        }
        TimeSlot slot = timeSlotRepository.findById(booking.getSlot().getSlotId())
                .orElseThrow(() -> new IllegalArgumentException("Selected time slot was not found"));
        if (!"AVAILABLE".equalsIgnoreCase(slot.getStatus()) || slot.getStartAt().isBefore(java.time.LocalDateTime.now())
                || bookingRepository.existsActiveBookingForBayAndTime(slot.getBay().getBayId(), slot.getStartAt(), slot.getEndAt())) {
            throw new IllegalStateException("Selected time slot is already booked");
        }

        booking.setCustomer(customer);
        booking.setVehicle(vehicle);
        booking.setSlot(slot);
        booking.setCentre(slot.getCentre());
        if (booking.getRef() == null || booking.getRef().isBlank() || bookingRepository.findByRef(booking.getRef()).isPresent()) {
            booking.setRef("BK-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        booking.setStatus("PENDING");
        booking.setCreatedAt(java.time.LocalDateTime.now());
        Booking savedBooking = bookingRepository.save(booking);
        auditLogService.record("Booking", "CREATE", null, "bookingId=" + savedBooking.getBookingId()
                + ", ref=" + savedBooking.getRef() + ", status=" + savedBooking.getStatus());
        notificationService.sendBookingEventNotification(savedBooking, false);
        return savedBooking;
    }

    @Transactional
    public Booking updateBookingStatus(Integer bookingId, String status, Authentication authentication) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));
        boolean customer = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"));
        if (customer) {
            String email = authentication.getName();
            Integer customerId = userRepository.findByEmail(email).map(user -> user.getUserId()).orElse(-1);
            if (!booking.getCustomer().getUserId().equals(customerId)
                    || !"CANCELLED".equals(status)
                    || !("PENDING".equals(booking.getStatus()) || "SCHEDULED".equals(booking.getStatus()))) {
                throw new IllegalArgumentException("You can only cancel your own upcoming booking");
            }
        } else if (!isAllowedStaffTransition(booking.getStatus(), status, authentication)) {
            throw new IllegalArgumentException("This booking status transition is not allowed for your role");
        }
        String oldStatus = booking.getStatus();
        boolean newlyCancelled = !"CANCELLED".equals(oldStatus) && "CANCELLED".equals(status);
        booking.setStatus(status);
        Booking savedBooking = bookingRepository.save(booking);
        auditLogService.record("Booking", "STATUS_CHANGE", "status=" + oldStatus,
                "bookingId=" + bookingId + ", status=" + status);
        if (newlyCancelled) {
            notificationService.sendBookingEventNotification(savedBooking, true);
        }
        return savedBooking;
    }

    private boolean isAllowedStaffTransition(String currentStatus, String targetStatus, Authentication authentication) {
        boolean admin = hasRole(authentication, "ADMIN");
        boolean customerService = hasRole(authentication, "CUSTOMER_SERVICE_OFFICER");
        boolean scheduler = hasRole(authentication, "SCHEDULING_OFFICER");
        boolean workshop = hasRole(authentication, "WORKSHOP_OPERATIONS_MANAGER");
        boolean upcoming = "PENDING".equals(currentStatus) || "SCHEDULED".equals(currentStatus);
        boolean cancelUpcoming = upcoming && "CANCELLED".equals(targetStatus);
        boolean adminTransition = admin && (upcoming && ("IN_PROGRESS".equals(targetStatus) || "CANCELLED".equals(targetStatus))
                || "IN_PROGRESS".equals(currentStatus) && ("COMPLETED".equals(targetStatus) || "CANCELLED".equals(targetStatus)));
        boolean workshopTransition = workshop && (upcoming && "IN_PROGRESS".equals(targetStatus)
                || "IN_PROGRESS".equals(currentStatus) && ("COMPLETED".equals(targetStatus) || "CANCELLED".equals(targetStatus)));
        return adminTransition || workshopTransition || cancelUpcoming && (customerService || scheduler);
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream().anyMatch(authority ->
                authority.getAuthority().equals("ROLE_" + role));
    }

    public List<Booking> getMyBookings(String email, lk.autoflow.backend.user.UserRepository userRepository) {
        lk.autoflow.backend.user.User user = userRepository.findByEmail(email).orElseThrow();
        return bookingRepository.findByCustomer_UserId(user.getUserId());
    }

    @Transactional
    public Booking updateBooking(Integer bookingId, Booking updatedBooking) {
        return bookingRepository.findById(bookingId).map(existing -> {
            String oldValue = "serviceType=" + existing.getServiceType();
            existing.setServiceType(updatedBooking.getServiceType());
            Booking saved = bookingRepository.save(existing);
            auditLogService.record("Booking", "UPDATE", oldValue, "bookingId=" + bookingId
                    + ", serviceType=" + saved.getServiceType());
            return saved;
        }).orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));
    }

    @Transactional
    public void deleteBooking(Integer bookingId) {
        bookingRepository.findById(bookingId).ifPresent(booking -> {
            boolean newlyCancelled = !"CANCELLED".equals(booking.getStatus());
            String oldStatus = booking.getStatus();
            booking.setStatus("CANCELLED");
            bookingRepository.save(booking);
            auditLogService.record("Booking", "CANCEL", "status=" + oldStatus,
                    "bookingId=" + bookingId + ", status=CANCELLED");
            if (newlyCancelled) {
                notificationService.sendBookingEventNotification(booking, true);
            }
        });
    }
}
