package lk.autoflow.backend.fuel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FuelTypeRepository extends JpaRepository<FuelType, Integer> {
    List<FuelType> findByStatusOrderByNameAsc(String status);
    Optional<FuelType> findByCodeIgnoreCase(String code);
}
