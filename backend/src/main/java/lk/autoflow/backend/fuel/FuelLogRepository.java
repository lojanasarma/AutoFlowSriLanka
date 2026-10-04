package lk.autoflow.backend.fuel;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FuelLogRepository extends JpaRepository<FuelLog, Integer> {
    List<FuelLog> findByVehicle_VehicleId(Integer vehicleId);
    boolean existsByLogIdAndVehicle_Owner_UserId(Integer logId, Integer userId);
    List<FuelLog> findByStation_StationId(Integer stationId);
    List<FuelLog> findByStatus(String status);
    boolean existsByStation_StationId(Integer stationId);
}
