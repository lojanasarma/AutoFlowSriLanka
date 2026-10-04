package lk.autoflow.backend.booking;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "WaitingList")
@Data
@EqualsAndHashCode(exclude = "booking")
@ToString(exclude = "booking")
public class WaitingList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wait_id")
    private Integer waitId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "preferred_slot", nullable = false)
    private LocalDateTime preferredSlot;

    @Column(length = 20)
    private String status = "WAITING";
}
