package lk.autoflow.backend.booking;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Centre")
@Data
public class Centre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "centre_id")
    private Integer centreId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 255)
    private String location;
}
