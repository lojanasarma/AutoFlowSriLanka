package lk.autoflow.backend.payment;

import jakarta.persistence.*;
import lk.autoflow.backend.booking.Booking;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Payment")
@Data
@EqualsAndHashCode(exclude = "booking")
@ToString(exclude = "booking")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Integer paymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "provider_ref", unique = true, length = 100)
    private String providerRef;

    @Column(length = 50)
    private String method; // CASH, CARD, BANK_TRANSFER

    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(length = 20)
    private String status = "PENDING"; // PENDING, COMPLETED, FAILED, REFUNDED

    @Column(name = "attempted_at")
    private LocalDateTime attemptedAt = LocalDateTime.now();

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /** Demo-only gateway outcome. It is never persisted and must not contain card credentials. */
    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    private String demoCardOutcome;
}
