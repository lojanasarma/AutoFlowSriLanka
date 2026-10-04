package lk.autoflow.backend.vehicle;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {
    Optional<Vehicle> findByRegNo(String regNo);
    Optional<Vehicle> findByRegNoIgnoreCase(String regNo);
    List<Vehicle> findByOwner_UserId(Integer ownerId);
    boolean existsByOwner_UserId(Integer ownerId);
    List<Vehicle> findByOwner_UserIdAndStatus(Integer ownerId, String status);
    boolean existsByVehicleIdAndOwner_UserId(Integer vehicleId, Integer ownerId);
    List<Vehicle> findByStatus(String status);
}
