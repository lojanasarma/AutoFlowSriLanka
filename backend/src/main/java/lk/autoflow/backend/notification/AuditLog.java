package lk.autoflow.backend.notification;

import jakarta.persistence.*;
import lk.autoflow.backend.user.User;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "AuditLog")
@Data
@EqualsAndHashCode(exclude = "actor")
@ToString(exclude = "actor")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Integer auditId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Column(nullable = false, length = 50)
    private String entity;

    @Column(nullable = false, length = 50)
    private String action;

    @Lob
    @Column(name = "old_value")
    private String oldValue;

    @Lob
    @Column(name = "new_value")
    private String newValue;

    @Column(name = "occurred_at")
    private LocalDateTime occurredAt = LocalDateTime.now();
}
