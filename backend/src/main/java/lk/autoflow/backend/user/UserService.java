package lk.autoflow.backend.user;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.security.crypto.password.PasswordEncoder;
import lk.autoflow.backend.notification.AuditLogService;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataAccessException;
import lk.autoflow.backend.booking.BookingRepository;
import lk.autoflow.backend.vehicle.VehicleRepository;
import lk.autoflow.backend.payment.RefundRepository;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final java.util.Set<String> STAFF_ROLES = java.util.Set.of(
            "CUSTOMER_SERVICE_OFFICER", "SCHEDULING_OFFICER", "WORKSHOP_OPERATIONS_MANAGER",
            "FINANCE_OFFICER", "FUEL_STATION_MANAGER");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final EntityManager entityManager;
    private final JdbcTemplate jdbcTemplate;
    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final RefundRepository refundRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getCustomers() {
        return userRepository.findByRole("CUSTOMER");
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Transactional
    public User createUser(User user) {
        validateUserInput(user, true);
        if (userRepository.findByEmail(user.getEmail().trim()).isPresent()) {
            throw new IllegalArgumentException("Email is already in use");
        }
        if (userRepository.findByMobile(user.getMobile().trim()).isPresent()) {
            throw new IllegalArgumentException("Mobile number is already in use");
        }
        user.setEmail(user.getEmail().trim());
        user.setMobile(user.getMobile().trim());
        User userToSave;
        if ("CUSTOMER".equals(user.getRole())) {
            Customer customer = new Customer();
            customer.setLoyaltyPoints(0);
            userToSave = customer;
        } else if ("ADMIN".equals(user.getRole())) {
            userToSave = new User();
        } else if (STAFF_ROLES.contains(user.getRole())) {
            Staff staff = new Staff();
            staff.setDepartment(user.getRole());
            userToSave = staff;
        } else {
            throw new IllegalArgumentException("Select a supported role");
        }

        userToSave.setFullName(user.getFullName());
        userToSave.setEmail(user.getEmail());
        userToSave.setMobile(user.getMobile());
        userToSave.setRole(user.getRole());
        userToSave.setStatus(user.getStatus());
        userToSave.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));

        User saved = userRepository.save(userToSave);
        auditLogService.record("User", "CREATE", null, "userId=" + saved.getUserId()
                + ", role=" + saved.getRole() + ", status=" + saved.getStatus());
        return saved;
    }

    @Transactional
    public User updateUser(Integer userId, User userDetails) {
        return userRepository.findById(userId).map(existing -> {
            validateUserInput(userDetails, false);
            String targetRole = userDetails.getRole() == null || userDetails.getRole().isBlank()
                    ? existing.getRole() : userDetails.getRole().trim().toUpperCase(java.util.Locale.ROOT);
            validateRoleChange(existing, targetRole);
            String targetStatus = userDetails.getStatus().trim().toUpperCase(java.util.Locale.ROOT);
            protectLastActiveAdmin(existing, targetRole, targetStatus);
            userRepository.findByEmail(userDetails.getEmail().trim())
                    .filter(other -> !other.getUserId().equals(userId))
                    .ifPresent(other -> { throw new IllegalArgumentException("Email is already in use"); });
            userRepository.findByMobile(userDetails.getMobile().trim())
                    .filter(other -> !other.getUserId().equals(userId))
                    .ifPresent(other -> { throw new IllegalArgumentException("Mobile number is already in use"); });
            String oldValue = "name=" + existing.getFullName() + ", email=" + existing.getEmail()
                    + ", mobile=" + existing.getMobile() + ", role=" + existing.getRole()
                    + ", status=" + existing.getStatus();
            existing.setFullName(userDetails.getFullName());
            existing.setEmail(userDetails.getEmail().trim());
            existing.setMobile(userDetails.getMobile().trim());
            existing.setStatus(targetStatus);
            existing.setRole(targetRole);
            if (existing instanceof Staff staff && STAFF_ROLES.contains(targetRole)) staff.setDepartment(targetRole);
            User saved = userRepository.save(existing);
            auditLogService.record("User", "UPDATE", oldValue, "userId=" + userId + ", name="
                    + saved.getFullName() + ", email=" + saved.getEmail() + ", mobile=" + saved.getMobile()
                    + ", role=" + saved.getRole() + ", status=" + saved.getStatus());
            if (requiresSubtypeMigration(saved, targetRole)) {
                entityManager.flush();
                migrateSubtype(saved, targetRole);
                entityManager.clear();
                return userRepository.findById(userId).orElseThrow();
            }
            return saved;
        }).orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }

    private void validateUserInput(User user, boolean creating) {
        if (user == null || user.getFullName() == null || user.getFullName().isBlank()
                || user.getEmail() == null || !user.getEmail().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
                || user.getMobile() == null || !user.getMobile().trim().matches("\\+?[0-9]{9,15}")) {
            throw new IllegalArgumentException("Name, valid email, and valid mobile number are required");
        }
        if (creating && (user.getPasswordHash() == null || user.getPasswordHash().length() < 6)) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        if (user.getStatus() == null || !java.util.Set.of("ACTIVE", "INACTIVE", "SUSPENDED", "PENDING").contains(user.getStatus().toUpperCase(java.util.Locale.ROOT))) {
            throw new IllegalArgumentException("Select a supported account status");
        }
        String role = user.getRole() == null ? "" : user.getRole().trim().toUpperCase(java.util.Locale.ROOT);
        if (!"CUSTOMER".equals(role) && !"ADMIN".equals(role) && !STAFF_ROLES.contains(role)) {
            throw new IllegalArgumentException("Select a supported role");
        }
    }

    private void validateRoleChange(User existing, String targetRole) {
        boolean supportedRole = "CUSTOMER".equals(targetRole) || "ADMIN".equals(targetRole) || STAFF_ROLES.contains(targetRole);
        if (!supportedRole) throw new IllegalArgumentException("Select a supported role");
        boolean toCustomer = "CUSTOMER".equals(targetRole);
        boolean currentlyCustomer = existing instanceof Customer;
        if (toCustomer != currentlyCustomer && currentlyCustomer
                && (bookingRepository.existsByCustomer_UserId(existing.getUserId())
                    || vehicleRepository.existsByOwner_UserId(existing.getUserId()))) {
            throw new IllegalArgumentException("This customer has linked vehicles or bookings; their account type cannot be changed without breaking history");
        }
        boolean toStaff = STAFF_ROLES.contains(targetRole);
        boolean currentlyStaff = existing instanceof Staff;
        if (currentlyStaff && !toStaff) {
            boolean hasRefunds = refundRepository.existsByDecidedBy_UserId(existing.getUserId());
            boolean hasTechnicianRecord = hasTechnicianRecord(existing.getUserId());
            if (hasRefunds || hasTechnicianRecord) {
                throw new IllegalArgumentException("This staff account has linked operational or financial history and cannot be converted");
            }
        }
    }

    private boolean hasTechnicianRecord(Integer userId) {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM Technician WHERE tech_id = ?", Long.class, userId);
            return count != null && count > 0;
        } catch (DataAccessException ignored) {
            // Some local schema versions do not include the optional Technician table.
            return false;
        }
    }

    private boolean requiresSubtypeMigration(User user, String targetRole) {
        return (user instanceof Customer && !"CUSTOMER".equals(targetRole))
                || (user instanceof Staff && !STAFF_ROLES.contains(targetRole))
                || (!(user instanceof Customer) && !(user instanceof Staff)
                    && ("CUSTOMER".equals(targetRole) || STAFF_ROLES.contains(targetRole)));
    }

    private void migrateSubtype(User user, String targetRole) {
        Integer id = user.getUserId();
        if (user instanceof Customer) {
            jdbcTemplate.update("DELETE FROM Customer WHERE customer_id = ?", id);
        } else if (user instanceof Staff) {
            jdbcTemplate.update("DELETE FROM Staff WHERE staff_id = ?", id);
        }
        if ("CUSTOMER".equals(targetRole)) {
            jdbcTemplate.update("INSERT INTO Customer (customer_id, loyalty_points) VALUES (?, 0)", id);
        } else if (STAFF_ROLES.contains(targetRole)) {
            jdbcTemplate.update("INSERT INTO Staff (staff_id, department) VALUES (?, ?)", id, targetRole);
        }
    }

    public void deleteUser(Integer userId) {
        userRepository.findById(userId).ifPresent(user -> {
            protectLastActiveAdmin(user, user.getRole(), "INACTIVE");
            // Soft delete user
            String oldStatus = user.getStatus();
            user.setStatus("INACTIVE");
            userRepository.save(user);
            auditLogService.record("User", "DEACTIVATE", "status=" + oldStatus,
                    "userId=" + userId + ", status=INACTIVE");
        });
    }

    private void protectLastActiveAdmin(User existing, String targetRole, String targetStatus) {
        if ("ADMIN".equals(existing.getRole()) && "ACTIVE".equals(existing.getStatus())
                && (!"ADMIN".equals(targetRole) || !"ACTIVE".equals(targetStatus))
                && userRepository.findByRoleAndStatus("ADMIN", "ACTIVE").size() <= 1) {
            throw new IllegalArgumentException("The last active administrator cannot be deactivated or reassigned");
        }
    }
}

