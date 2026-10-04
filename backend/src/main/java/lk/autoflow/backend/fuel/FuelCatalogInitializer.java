package lk.autoflow.backend.fuel;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class FuelCatalogInitializer implements CommandLineRunner {
    private final FuelTypeRepository fuelTypeRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<FuelTypeRequest> defaults = List.of(
                new FuelTypeRequest("PETROL", "Petrol"),
                new FuelTypeRequest("DIESEL", "Diesel"),
                new FuelTypeRequest("HYBRID", "Hybrid"),
                new FuelTypeRequest("EV", "Electric charging"));
        for (FuelTypeRequest item : defaults) {
            fuelTypeRepository.findByCodeIgnoreCase(item.code()).orElseGet(() -> {
                FuelType type = new FuelType();
                type.setCode(item.code());
                type.setName(item.name());
                type.setStatus("ACTIVE");
                return fuelTypeRepository.save(type);
            });
        }
    }
}
