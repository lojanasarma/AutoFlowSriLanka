package lk.autoflow.backend.fuel;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "FuelStation")
@Data
public class FuelStation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "station_id")
    private Integer stationId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 255)
    private String location;
}
