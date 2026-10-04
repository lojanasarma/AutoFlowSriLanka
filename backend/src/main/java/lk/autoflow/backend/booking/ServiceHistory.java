package lk.autoflow.backend.booking;

import jakarta.persistence.*;
import lk.autoflow.backend.vehicle.Vehicle;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "ServiceHistory")
@Data
@EqualsAndHashCode(exclude = {"vehicle", "booking"})
@ToString(exclude = {"vehicle", "booking"})
public class ServiceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Integer historyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    private Integer mileage;

    @Lob
    private String notes;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;
}
