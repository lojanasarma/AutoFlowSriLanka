package lk.autoflow.backend.security;

import lk.autoflow.backend.booking.BookingRepository;
import lk.autoflow.backend.fuel.FuelLogRepository;
import lk.autoflow.backend.payment.PaymentRepository;
import lk.autoflow.backend.notification.NotificationRepository;
import lk.autoflow.backend.user.UserRepository;
import lk.autoflow.backend.vehicle.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("accessPolicy")
@RequiredArgsConstructor
public class AccessPolicy {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final FuelLogRepository fuelLogRepository;
    private final NotificationRepository notificationRepository;

    public boolean canAccessUser(Integer userId, Authentication authentication) {
        return isAdmin(authentication) || currentUserId(authentication).equals(userId);
    }

    public boolean canAccessVehicle(Integer vehicleId, Authentication authentication) {
        return isOperationalStaff(authentication)
                || vehicleRepository.existsByVehicleIdAndOwner_UserId(vehicleId, currentUserId(authentication));
    }

    public boolean canAccessBooking(Integer bookingId, Authentication authentication) {
        return isOperationalStaff(authentication)
                || bookingRepository.existsByBookingIdAndCustomer_UserId(bookingId, currentUserId(authentication));
    }

    public boolean canAccessPayment(Integer paymentId, Authentication authentication) {
        return isFinanceStaff(authentication)
                || paymentRepository.existsByPaymentIdAndBooking_Customer_UserId(paymentId, currentUserId(authentication));
    }

    public boolean canAccessFuelLog(Integer logId, Authentication authentication) {
        return hasAnyRole(authentication, "ADMIN", "FUEL_STATION_MANAGER")
                || fuelLogRepository.existsByLogIdAndVehicle_Owner_UserId(logId, currentUserId(authentication));
    }

    public boolean canAccessNotification(Integer notificationId, Authentication authentication) {
        return isAdmin(authentication)
                || notificationRepository.existsByNotifIdAndUser_UserId(notificationId, currentUserId(authentication));
    }

    private boolean isAdmin(Authentication authentication) {
        return hasAnyRole(authentication, "ADMIN");
    }

    private boolean isOperationalStaff(Authentication authentication) {
        return hasAnyRole(authentication, "ADMIN", "CUSTOMER_SERVICE_OFFICER", "SCHEDULING_OFFICER", "WORKSHOP_OPERATIONS_MANAGER", "FINANCE_OFFICER", "FUEL_STATION_MANAGER");
    }

    private boolean isFinanceStaff(Authentication authentication) {
        return hasAnyRole(authentication, "ADMIN", "FINANCE_OFFICER");
    }

    private boolean hasAnyRole(Authentication authentication, String... roles) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        return authentication.getAuthorities().stream().anyMatch(authority -> {
            for (String role : roles) {
                if (authority.getAuthority().equals("ROLE_" + role)) return true;
            }
            return false;
        });
    }

    private Integer currentUserId(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName()).map(user -> user.getUserId()).orElse(-1);
    }
}
