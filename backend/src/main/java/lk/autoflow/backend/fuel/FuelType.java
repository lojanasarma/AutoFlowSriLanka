package lk.autoflow.backend.fuel;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "FuelType", uniqueConstraints = @UniqueConstraint(name = "uk_fuel_type_code", columnNames = "code"))
@Data
public class FuelType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fuel_type_id")
    private Integer fuelTypeId;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";
}
