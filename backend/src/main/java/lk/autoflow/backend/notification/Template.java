package lk.autoflow.backend.notification;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Template")
@Data
public class Template {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "template_id")
    private Integer templateId;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false, length = 100)
    private String subject;

    @Lob
    @Column(nullable = false)
    private String body;

    @Column(length = 20)
    private String status = "ACTIVE";
}
