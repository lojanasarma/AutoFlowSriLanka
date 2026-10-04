package lk.autoflow.backend.notification;

import lk.autoflow.backend.user.User;
import lk.autoflow.backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void record(String entity, String action, String oldValue, String newValue) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return;
        }
        userRepository.findByEmail(authentication.getName()).ifPresent(actor ->
                record(entity, action, oldValue, newValue, actor));
    }

    @Transactional
    public void record(String entity, String action, String oldValue, String newValue, User actor) {
        if (actor == null) return;
        AuditLog log = new AuditLog();
        log.setActor(actor);
        log.setEntity(entity);
        log.setAction(action);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        auditLogRepository.save(log);
    }
}
