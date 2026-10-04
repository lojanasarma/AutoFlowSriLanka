package lk.autoflow.backend.booking;

import jakarta.persistence.*;
import lk.autoflow.backend.user.Customer;
import lk.autoflow.backend.vehicle.Vehicle;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "Booking")
@Data
@EqualsAndHashCode(exclude = {"customer", "vehicle", "centre", "slot"})
@ToString(exclude = {"customer", "vehicle", "centre", "slot"})
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Integer bookingId;

    @Column(nullable = false, unique = true, length = 50)
    @com.fasterxml.jackson.annotation.JsonProperty("bookingRef")
    private String ref;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "service_type", nullable = false, length = 50)
    private String serviceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "centre_id", nullable = false)
    private Centre centre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("timeSlot")
    private TimeSlot slot;

    @Column(length = 20)
    private String status = "PENDING";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
