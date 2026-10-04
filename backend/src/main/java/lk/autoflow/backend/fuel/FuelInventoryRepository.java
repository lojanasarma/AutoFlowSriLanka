package lk.autoflow.backend.fuel;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FuelInventoryRepository extends JpaRepository<FuelInventory, Integer> {
    List<FuelInventory> findAllByOrderByStation_NameAscFuelType_NameAsc();
    List<FuelInventory> findByStation_StationIdOrderByFuelType_NameAsc(Integer stationId);
    boolean existsByStation_StationId(Integer stationId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from FuelInventory i where i.station.stationId = :stationId and i.fuelType.fuelTypeId = :fuelTypeId")
    Optional<FuelInventory> lockByStationAndFuelType(@Param("stationId") Integer stationId,
                                                     @Param("fuelTypeId") Integer fuelTypeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from FuelInventory i where i.inventoryId = :inventoryId")
    Optional<FuelInventory> lockById(@Param("inventoryId") Integer inventoryId);
}
