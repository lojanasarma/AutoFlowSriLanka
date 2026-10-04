package lk.autoflow.backend.notification;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER') or @accessPolicy.canAccessUser(#userId, authentication)")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Integer userId) {
        return ResponseEntity.ok(notificationService.getNotificationsByUser(userId));
    }

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER')")
    public ResponseEntity<?> sendNotification(@RequestBody Notification notification) {
        try {
            return ResponseEntity.ok(notificationService.sendNotification(notification));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/audit/{entity}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@PathVariable String entity) {
        return ResponseEntity.ok(notificationService.getAuditLogsByEntity(entity));
    }




    @PostMapping("/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuditLog> recordAuditLog(@RequestBody AuditLog auditLog) {
        return ResponseEntity.ok(notificationService.recordAuditLog(auditLog));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@accessPolicy.canAccessNotification(#id, authentication)")
    public ResponseEntity<Void> deleteNotification(@PathVariable Integer id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/audit/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAuditLog(@PathVariable Integer id) {
        notificationService.deleteAuditLog(id);
        return ResponseEntity.noContent().build();
    }

    // --- New Features Endpoints ---

    @PatchMapping("/{id}/status")
    @PreAuthorize("@accessPolicy.canAccessNotification(#id, authentication)")
    public ResponseEntity<Notification> markAsRead(@PathVariable Integer id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PatchMapping("/user/{userId}/mark-all-read")
    @PreAuthorize("@accessPolicy.canAccessUser(#userId, authentication)")
    public ResponseEntity<Void> markAllAsRead(@PathVariable Integer userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user/{userId}/unread-count")
    @PreAuthorize("@accessPolicy.canAccessUser(#userId, authentication)")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Integer userId) {
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PostMapping("/send-bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER')")
    public ResponseEntity<?> sendBulkNotification(@RequestParam String role, @RequestParam Integer templateId, @RequestParam String channel) {
        try {
            notificationService.sendBulkNotification(role, templateId, channel);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- Template CRUD Endpoints ---

    @GetMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER')")
    public ResponseEntity<List<Template>> getAllTemplates() {
        return ResponseEntity.ok(notificationService.getAllTemplates());
    }

    @PostMapping("/templates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createTemplate(@RequestBody Template template) {
        try {
            return ResponseEntity.ok(notificationService.createTemplate(template));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateTemplate(@PathVariable Integer id, @RequestBody Template template) {
        try {
            return ResponseEntity.ok(notificationService.updateTemplate(id, template));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Integer id) {
        notificationService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }
}
