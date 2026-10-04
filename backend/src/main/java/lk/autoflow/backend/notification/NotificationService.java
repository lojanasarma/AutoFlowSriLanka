package lk.autoflow.backend.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Set;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lk.autoflow.backend.user.User;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Set<String> SUPPORTED_CHANNELS = Set.of("SYSTEM", "EMAIL", "SMS");

    private final NotificationRepository notificationRepository;
    private final TemplateRepository templateRepository;
    private final AuditLogRepository auditLogRepository;
    private final lk.autoflow.backend.user.UserRepository userRepository;
    private final AuditLogService auditLogService;

    public List<Notification> getNotificationsByUser(Integer userId) {
        return notificationRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
    }

    public List<AuditLog> getAuditLogsByEntity(String entity) {
        return auditLogRepository.findByEntityOrderByOccurredAtDesc(entity);
    }

    @Transactional
    public Notification sendNotification(Notification notification) {
        if (notification.getUser() == null || notification.getUser().getUserId() == null
                || notification.getTemplate() == null || notification.getTemplate().getTemplateId() == null
                || !SUPPORTED_CHANNELS.contains(notification.getChannel())) {
            throw new IllegalArgumentException("A recipient, template, and supported channel are required");
        }
        notification.setStatus("SENT");
        Notification saved = notificationRepository.save(notification);
        auditLogService.record("Notification", "SEND", null, "notifId=" + saved.getNotifId()
                + ", userId=" + saved.getUser().getUserId() + ", channel=" + saved.getChannel());
        return saved;
    }

    @Transactional
    public Notification sendBookingEventNotification(lk.autoflow.backend.booking.Booking booking, boolean cancelled) {
        String subject = cancelled ? "Booking cancelled" : "Booking confirmed";
        String body = "Booking ID: " + booking.getBookingId() + "\n"
                + "Reference: " + booking.getRef() + "\n"
                + "Service: " + booking.getServiceType() + "\n"
                + "Vehicle: " + booking.getVehicle().getRegNo() + "\n"
                + "Service centre: " + booking.getCentre().getName() + "\n"
                + "Appointment: " + booking.getSlot().getStartAt() + "\n"
                + (cancelled ? "Your booking has been cancelled." : "Your booking has been created.");
        return sendSystemNotification(booking.getCustomer(), subject, body);
    }

    /** Stores a per-event message snapshot so later notifications never inherit edited template text. */
    @Transactional
    public Notification sendSystemNotification(User recipient, String subject, String body) {
        if (recipient == null || recipient.getUserId() == null || subject == null || subject.isBlank()
                || body == null || body.isBlank()) {
            throw new IllegalArgumentException("A recipient, subject, and message are required");
        }
        Template template = new Template();
        template.setType("EVENT_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        template.setSubject(subject.length() > 100 ? subject.substring(0, 100) : subject);
        template.setBody(body);
        template.setStatus("ACTIVE");
        template = templateRepository.save(template);

        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setTemplate(template);
        notification.setChannel("SYSTEM");
        notification.setStatus("SENT");
        Notification saved = notificationRepository.save(notification);
        auditLogService.record("Notification", "SEND", null,
                "notifId=" + saved.getNotifId() + ", userId=" + recipient.getUserId() + ", channel=SYSTEM");
        return saved;
    }

    @Transactional
    public AuditLog recordAuditLog(AuditLog auditLog) {
        return auditLogRepository.save(auditLog);
    }

    @Transactional
    public void deleteNotification(Integer notifId) {
        if (!notificationRepository.existsById(notifId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        }
        notificationRepository.findById(notifId).ifPresent(notification ->
                auditLogService.record("Notification", "CLEAR", "notifId=" + notifId
                        + ", status=" + notification.getStatus(), null));
        notificationRepository.deleteById(notifId);
    }

    @Transactional
    public void deleteAuditLog(Integer auditId) {
        if (!auditLogRepository.existsById(auditId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Audit log not found");
        }
        auditLogRepository.deleteById(auditId);
    }

    // --- New Features ---

    @Transactional
    public Notification markAsRead(Integer notifId) {
        Notification notification = notificationRepository.findById(notifId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        String oldStatus = notification.getStatus();
        notification.setStatus("READ");
        Notification saved = notificationRepository.save(notification);
        if (!"READ".equals(oldStatus)) {
            auditLogService.record("Notification", "MARK_READ", "status=" + oldStatus,
                    "status=READ, notifId=" + notifId);
        }
        return saved;
    }

    @Transactional
    public void markAllAsRead(Integer userId) {
        long unreadBefore = notificationRepository.countByUser_UserIdAndStatus(userId, "SENT");
        notificationRepository.markAllAsReadByUser(userId);
        if (unreadBefore > 0) auditLogService.record("Notification", "MARK_ALL_READ",
                "unread=" + unreadBefore, "unread=0, userId=" + userId);
    }

    public long getUnreadCount(Integer userId) {
        return notificationRepository.countByUser_UserIdAndStatus(userId, "SENT");
    }

    @Transactional
    public void sendBulkNotification(String role, Integer templateId, String channel) {
        if (role == null || role.isBlank() || templateId == null || !SUPPORTED_CHANNELS.contains(channel)) {
            throw new IllegalArgumentException("A target role, template, and supported channel are required");
        }
        Template template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found"));
        List<lk.autoflow.backend.user.User> users = userRepository.findByRole(role);
        for (lk.autoflow.backend.user.User user : users) {
            Notification n = new Notification();
            n.setUser(user);
            n.setTemplate(template);
            n.setChannel(channel);
            n.setStatus("SENT");
            notificationRepository.save(n);
        }
        auditLogService.record("Notification", "BROADCAST", null,
                "role=" + role + ", recipients=" + users.size() + ", channel=" + channel);
    }

    // --- Template CRUD ---
    public List<Template> getAllTemplates() {
        return templateRepository.findAll().stream()
                .filter(template -> template.getType() == null || !template.getType().startsWith("EVENT_"))
                .toList();
    }

    @Transactional
    public Template createTemplate(Template template) {
        validateTemplate(template);
        if (template.getStatus() == null || template.getStatus().isBlank()) template.setStatus("ACTIVE");
        Template saved = templateRepository.save(template);
        auditLogService.record("NotificationTemplate", "CREATE", null,
                "templateId=" + saved.getTemplateId() + ", type=" + saved.getType());
        return saved;
    }

    @Transactional
    public Template updateTemplate(Integer id, Template templateDetails) {
        Template template = templateRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found"));
        validateTemplate(templateDetails);
        String oldValue = "type=" + template.getType() + ", subject=" + template.getSubject()
                + ", status=" + template.getStatus();
        template.setType(templateDetails.getType().trim());
        template.setSubject(templateDetails.getSubject().trim());
        template.setBody(templateDetails.getBody().trim());
        if (templateDetails.getStatus() != null && !templateDetails.getStatus().isBlank()) {
            template.setStatus(templateDetails.getStatus().trim());
        }
        Template saved = templateRepository.save(template);
        auditLogService.record("NotificationTemplate", "UPDATE", oldValue,
                "templateId=" + id + ", type=" + saved.getType() + ", subject=" + saved.getSubject()
                        + ", status=" + saved.getStatus());
        return saved;
    }

    @Transactional
    public void deleteTemplate(Integer id) {
        if (!templateRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found");
        }
        templateRepository.findById(id).ifPresent(template -> auditLogService.record(
                "NotificationTemplate", "DELETE", "templateId=" + id + ", type=" + template.getType(), null));
        templateRepository.deleteById(id);
    }

    private void validateTemplate(Template template) {
        if (template == null || template.getType() == null || template.getType().isBlank()
                || template.getSubject() == null || template.getSubject().isBlank()
                || template.getBody() == null || template.getBody().isBlank()) {
            throw new IllegalArgumentException("Template type, subject, and body are required");
        }
    }
}
