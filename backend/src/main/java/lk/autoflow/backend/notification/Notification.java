package lk.autoflow.backend.notification;

import jakarta.persistence.*;
import lk.autoflow.backend.user.User;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "Notification")
@Data
@EqualsAndHashCode(exclude = {"user", "template"})
@ToString(exclude = {"user", "template"})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notif_id")
    private Integer notifId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private Template template;

    @Column(length = 20)
    private String channel; // SMS, EMAIL, SYSTEM

    @Column(length = 20)
    private String status = "SENT";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
