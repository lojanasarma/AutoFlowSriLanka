package lk.autoflow.backend.vehicle;

import jakarta.persistence.*;
import lk.autoflow.backend.user.Customer;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Vehicle")
@Data
@EqualsAndHashCode(exclude = {"documents", "owner"})
@ToString(exclude = {"documents", "owner"})
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicle_id")
    private Integer vehicleId;

    @Column(name = "reg_no", nullable = false, unique = true, length = 20)
    private String regNo;

    @Column(nullable = false, length = 50)
    private String make;

    @Column(nullable = false, length = 50)
    private String model;

    private Integer year;

    @Column(name = "fuel_type", length = 20)
    private String fuelType;

    @Column(name = "engine_capacity")
    private Integer engineCapacity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private Customer owner;

    @Column(name = "insurance_expiry", nullable = false)
    private LocalDate insuranceExpiry;

    private Integer mileage;

    @Column(length = 20)
    private String status = "ACTIVE";

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VehicleDocument> documents = new ArrayList<>();

    // Helper method to maintain bidirectional relationship
    public void addDocument(VehicleDocument document) {
        documents.add(document);
        document.setVehicle(this);
    }

    public void removeDocument(VehicleDocument document) {
        documents.remove(document);
        document.setVehicle(null);
    }
}
