package lk.autoflow.backend.fuel;

import jakarta.persistence.*;
import lk.autoflow.backend.user.User;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "FuelInventory", uniqueConstraints = @UniqueConstraint(
        name = "uk_station_fuel_type", columnNames = {"station_id", "fuel_type_id"}))
@Data
@EqualsAndHashCode(exclude = {"station", "fuelType", "updatedBy"})
@ToString(exclude = {"station", "fuelType", "updatedBy"})
public class FuelInventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_id")
    private Integer inventoryId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "station_id", nullable = false)
    private FuelStation station;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fuel_type_id", nullable = false)
    private FuelType fuelType;

    @Column(name = "stock_litres", nullable = false, precision = 12, scale = 2)
    private BigDecimal stockLitres = BigDecimal.ZERO;

    @Column(name = "reserved_litres", nullable = false, precision = 12, scale = 2)
    private BigDecimal reservedLitres = BigDecimal.ZERO;

    @Column(name = "capacity_litres", nullable = false, precision = 12, scale = 2)
    private BigDecimal capacityLitres;

    @Column(name = "low_stock_threshold", nullable = false, precision = 12, scale = 2)
    private BigDecimal lowStockThreshold = BigDecimal.ZERO;

    @Column(name = "price_per_litre", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerLitre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    @JsonIgnore
    private User updatedBy;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Transient
    public BigDecimal getAvailableLitres() {
        return stockLitres.subtract(reservedLitres);
    }

    @Transient
    public boolean isLowStock() {
        return getAvailableLitres().compareTo(lowStockThreshold) <= 0;
    }
}
