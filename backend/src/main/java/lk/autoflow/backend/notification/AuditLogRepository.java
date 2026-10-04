package lk.autoflow.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {
    List<AuditLog> findByEntityOrderByOccurredAtDesc(String entity);
    List<AuditLog> findByActor_UserId(Integer actorId);
}
