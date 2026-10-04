package lk.autoflow.backend.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lk.autoflow.backend.notification.NotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/customers")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER')")
    public ResponseEntity<List<User>> getCustomers() {
        return ResponseEntity.ok(userService.getCustomers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.createUser(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.updateUser(id, user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<User> updateMyProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @RequestBody User user
        ) {
        User currentUser = userService.getUserByEmail(userDetails.getUsername());
        String oldName = currentUser.getFullName();
        String oldMobile = currentUser.getMobile();
        user.setStatus(currentUser.getStatus());
        user.setRole(currentUser.getRole());
        user.setEmail(currentUser.getEmail());
        User updated = userService.updateUser(currentUser.getUserId(), user);
        java.util.List<String> changes = new java.util.ArrayList<>();
        if (!java.util.Objects.equals(oldName, updated.getFullName())) {
            changes.add("Full name: " + oldName + " → " + updated.getFullName());
        }
        if (!java.util.Objects.equals(oldMobile, updated.getMobile())) {
            changes.add("Phone number: " + oldMobile + " → " + updated.getMobile());
        }
        if (!changes.isEmpty()) {
            notificationService.sendSystemNotification(updated, "Profile information updated",
                    "Your profile was updated:\n" + String.join("\n", changes));
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
