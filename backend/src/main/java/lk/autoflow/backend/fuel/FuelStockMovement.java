package lk.autoflow.backend.fuel;

import jakarta.persistence.*;
import lk.autoflow.backend.user.User;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "FuelStockMovement")
@Data
@EqualsAndHashCode(exclude = {"inventory", "actor"})
@ToString(exclude = {"inventory", "actor"})
public class FuelStockMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "movement_id")
    private Integer movementId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "inventory_id", nullable = false)
    private FuelInventory inventory;

    @Column(nullable = false, length = 30)
    private String action;

    @Column(name = "quantity_delta", nullable = false, precision = 12, scale = 2)
    private BigDecimal quantityDelta;

    @Column(name = "stock_before", nullable = false, precision = 12, scale = 2)
    private BigDecimal stockBefore;

    @Column(name = "stock_after", nullable = false, precision = 12, scale = 2)
    private BigDecimal stockAfter;

    @Column(length = 255)
    private String reason;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt = LocalDateTime.now();
}
