package lk.autoflow.backend.fuel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FuelStockMovementRepository extends JpaRepository<FuelStockMovement, Integer> {
    List<FuelStockMovement> findTop250ByOrderByOccurredAtDesc();
    List<FuelStockMovement> findTop250ByInventory_Station_StationIdOrderByOccurredAtDesc(Integer stationId);
}
