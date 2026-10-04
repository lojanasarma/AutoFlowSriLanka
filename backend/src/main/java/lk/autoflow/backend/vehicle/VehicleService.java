package lk.autoflow.backend.vehicle;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.Optional;
import lk.autoflow.backend.notification.AuditLogService;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final lk.autoflow.backend.user.UserRepository userRepository;
    private final AuditLogService auditLogService;

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findByStatus("ACTIVE");
    }

    public Optional<Vehicle> getVehicleByRegNo(String regNo) {
        return vehicleRepository.findByRegNoIgnoreCase(regNo.trim());
    }

    public List<Vehicle> getVehiclesByOwner(Integer ownerId) {
        return vehicleRepository.findByOwner_UserIdAndStatus(ownerId, "ACTIVE");
    }

    public List<Vehicle> getMyVehicles(String email) {
        lk.autoflow.backend.user.User user = userRepository.findByEmail(email).orElseThrow();
        return vehicleRepository.findByOwner_UserIdAndStatus(user.getUserId(), "ACTIVE");
    }

    public Vehicle createVehicle(String email, lk.autoflow.backend.dto.VehicleCreateDTO dto) {
        String regNo = normalizeRegistration(dto.getRegNo());
        validateYear(dto.getYear());
        if (vehicleRepository.findByRegNoIgnoreCase(regNo).isPresent()) {
            throw new IllegalArgumentException("Registration number already exists");
        }
        lk.autoflow.backend.user.Customer owner;
        if (dto.getOwnerId() != null) {
            owner = (lk.autoflow.backend.user.Customer) userRepository.findById(dto.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Owner Customer not found"));
        } else {
            owner = (lk.autoflow.backend.user.Customer) userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Logged in Customer not found"));
        }
            
        Vehicle vehicle = new Vehicle();
        vehicle.setRegNo(regNo);
        vehicle.setMake(dto.getMake());
        vehicle.setModel(dto.getModel());
        vehicle.setYear(dto.getYear());
        vehicle.setFuelType(dto.getFuelType());
        vehicle.setEngineCapacity(dto.getEngineCapacity());
        if (dto.getInsuranceExpiry() != null) {
            vehicle.setInsuranceExpiry(dto.getInsuranceExpiry());
        } else {
            vehicle.setInsuranceExpiry(java.time.LocalDate.now().plusYears(1));
        }
        vehicle.setMileage(dto.getMileage());
        vehicle.setOwner(owner);
        // Status defaults to ACTIVE

        Vehicle saved = vehicleRepository.save(vehicle);
        auditLogService.record("Vehicle", "CREATE", null, "vehicleId=" + saved.getVehicleId()
                + ", regNo=" + saved.getRegNo() + ", ownerId=" + owner.getUserId());
        return saved;
    }

    public Vehicle updateVehicle(Integer id, Vehicle updatedVehicle) {
        return vehicleRepository.findById(id).map(existing -> {
            String regNo = normalizeRegistration(updatedVehicle.getRegNo());
            validateYear(updatedVehicle.getYear());
            vehicleRepository.findByRegNoIgnoreCase(regNo)
                    .filter(vehicle -> !vehicle.getVehicleId().equals(id))
                    .ifPresent(vehicle -> { throw new IllegalArgumentException("Registration number already exists"); });
            existing.setRegNo(regNo);
            existing.setMake(updatedVehicle.getMake());
            existing.setModel(updatedVehicle.getModel());
            existing.setYear(updatedVehicle.getYear());
            existing.setFuelType(updatedVehicle.getFuelType());
            existing.setEngineCapacity(updatedVehicle.getEngineCapacity());
            if (updatedVehicle.getInsuranceExpiry() != null) {
                existing.setInsuranceExpiry(updatedVehicle.getInsuranceExpiry());
            }
            existing.setMileage(updatedVehicle.getMileage());
            existing.setStatus(updatedVehicle.getStatus());
            String oldValue = "regNo=" + existing.getRegNo() + ", mileage=" + existing.getMileage()
                    + ", status=" + existing.getStatus();
            Vehicle saved = vehicleRepository.save(existing);
            auditLogService.record("Vehicle", "UPDATE", oldValue, "vehicleId=" + id + ", regNo="
                    + saved.getRegNo() + ", mileage=" + saved.getMileage() + ", status=" + saved.getStatus());
            return saved;
        }).orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
    }

    private String normalizeRegistration(String regNo) {
        if (regNo == null || !regNo.trim().matches("(?i)[A-Z0-9-]{2,20}")) {
            throw new IllegalArgumentException("Registration number must use 2 to 20 letters, numbers, or dashes");
        }
        return regNo.trim().toUpperCase(java.util.Locale.ROOT);
    }

    private void validateYear(Integer year) {
        if (year == null || year < 1900 || year > java.time.Year.now().getValue()) {
            throw new IllegalArgumentException("Invalid manufacture year. Enter a year from 1900 through the current year.");
        }
    }

    public void deleteVehicle(Integer id) {
        vehicleRepository.findById(id).ifPresent(vehicle -> {
            vehicle.setStatus("INACTIVE");
            vehicleRepository.save(vehicle);
            auditLogService.record("Vehicle", "DEACTIVATE", "vehicleId=" + id + ", status=ACTIVE",
                    "status=INACTIVE, regNo=" + vehicle.getRegNo());
        });
    }
}

