package lk.autoflow.backend.payment;

import jakarta.persistence.*;
import lk.autoflow.backend.user.Staff;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;

@Entity
@Table(name = "Refund")
@Data
@EqualsAndHashCode(exclude = {"payment", "decidedBy"})
@ToString(exclude = {"payment", "decidedBy"})
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "refund_id")
    private Integer refundId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    @Lob
    @Column(nullable = false)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by", nullable = false)
    private Staff decidedBy;

    @Column(length = 20)
    private String status = "APPROVED";
}
