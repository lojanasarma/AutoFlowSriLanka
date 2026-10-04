package lk.autoflow.backend.fuel;

import lk.autoflow.backend.notification.AuditLogService;
import lk.autoflow.backend.notification.NotificationService;
import lk.autoflow.backend.user.User;
import lk.autoflow.backend.user.UserRepository;
import lk.autoflow.backend.vehicle.Vehicle;
import lk.autoflow.backend.vehicle.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FuelService {

    private static final BigDecimal MAX_FUEL_LOG_QUANTITY = new BigDecimal("200.00");
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final FuelLogRepository fuelLogRepository;
    private final FuelStationRepository fuelStationRepository;
    private final VehicleRepository vehicleRepository;
    private final FuelTypeRepository fuelTypeRepository;
    private final FuelInventoryRepository fuelInventoryRepository;
    private final FuelStockMovementRepository fuelStockMovementRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public List<FuelStation> getAllStations() {
        return fuelStationRepository.findAll();
    }

    public List<FuelType> getFuelTypes() {
        return fuelTypeRepository.findByStatusOrderByNameAsc("ACTIVE");
    }

    public List<FuelInventory> getInventory(Integer stationId) {
        return stationId == null
                ? fuelInventoryRepository.findAllByOrderByStation_NameAscFuelType_NameAsc()
                : fuelInventoryRepository.findByStation_StationIdOrderByFuelType_NameAsc(stationId);
    }

    public List<FuelStockMovement> getStockMovements(Integer stationId) {
        return stationId == null
                ? fuelStockMovementRepository.findTop250ByOrderByOccurredAtDesc()
                : fuelStockMovementRepository.findTop250ByInventory_Station_StationIdOrderByOccurredAtDesc(stationId);
    }

    @Transactional
    public FuelType createFuelType(FuelTypeRequest request) {
        validateFuelType(request);
        String code = normalizeCode(request.code());
        if (fuelTypeRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new IllegalArgumentException("Fuel type code already exists");
        }
        FuelType fuelType = new FuelType();
        fuelType.setCode(code);
        fuelType.setName(request.name().trim());
        fuelType.setStatus("ACTIVE");
        FuelType saved = fuelTypeRepository.save(fuelType);
        auditLogService.record("FuelType", "CREATE", null,
                "fuelTypeId=" + saved.getFuelTypeId() + ", code=" + saved.getCode() + ", name=" + saved.getName());
        return saved;
    }

    @Transactional
    public FuelType setFuelTypeStatus(Integer fuelTypeId, String status) {
        if (!"ACTIVE".equals(status) && !"INACTIVE".equals(status)) {
            throw new IllegalArgumentException("Fuel type status must be ACTIVE or INACTIVE");
        }
        FuelType fuelType = fuelTypeRepository.findById(fuelTypeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fuel type not found"));
        String oldStatus = fuelType.getStatus();
        fuelType.setStatus(status);
        FuelType saved = fuelTypeRepository.save(fuelType);
        auditLogService.record("FuelType", "STATUS_CHANGE", "status=" + oldStatus,
                "fuelTypeId=" + fuelTypeId + ", status=" + status);
        return saved;
    }

    @Transactional
    public FuelStation createStation(FuelStation station) {
        validateStation(station);
        FuelStation saved = fuelStationRepository.save(station);
        auditLogService.record("FuelStation", "CREATE", null,
                "stationId=" + saved.getStationId() + ", name=" + saved.getName());
        return saved;
    }

    @Transactional
    public FuelStation updateStation(Integer stationId, FuelStation details) {
        validateStation(details);
        FuelStation station = fuelStationRepository.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fuel station was not found"));
        String old = "name=" + station.getName() + ", location=" + station.getLocation();
        station.setName(details.getName().trim());
        station.setLocation(details.getLocation().trim());
        FuelStation saved = fuelStationRepository.save(station);
        auditLogService.record("FuelStation", "UPDATE", old,
                "stationId=" + stationId + ", name=" + saved.getName() + ", location=" + saved.getLocation());
        return saved;
    }

    @Transactional
    public void deleteStation(Integer stationId) {
        if (!fuelStationRepository.existsById(stationId)) return;
        if (fuelLogRepository.existsByStation_StationId(stationId)
                || fuelInventoryRepository.existsByStation_StationId(stationId)) {
            throw new IllegalArgumentException("This station has inventory or fuel logs and cannot be deleted");
        }
        fuelStationRepository.deleteById(stationId);
        auditLogService.record("FuelStation", "DELETE", "stationId=" + stationId, null);
    }

    @Transactional
    public FuelInventory createInventory(FuelInventoryRequest request) {
        validateInventoryRequest(request);
        FuelStation station = fuelStationRepository.findById(request.stationId())
                .orElseThrow(() -> new IllegalArgumentException("Fuel station was not found"));
        FuelType type = fuelTypeRepository.findById(request.fuelTypeId())
                .filter(item -> "ACTIVE".equals(item.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("Select an active fuel type"));
        if (fuelInventoryRepository.lockByStationAndFuelType(station.getStationId(), type.getFuelTypeId()).isPresent()) {
            throw new IllegalArgumentException("This fuel type is already configured for the selected station");
        }

        BigDecimal opening = amount(request.openingStockLitres());
        FuelInventory inventory = new FuelInventory();
        inventory.setStation(station);
        inventory.setFuelType(type);
        inventory.setStockLitres(opening);
        inventory.setReservedLitres(ZERO);
        inventory.setCapacityLitres(amount(request.capacityLitres()));
        inventory.setLowStockThreshold(amount(request.lowStockThreshold()));
        inventory.setPricePerLitre(amount(request.pricePerLitre()));
        inventory.setUpdatedBy(currentActor());
        inventory.setUpdatedAt(LocalDateTime.now());
        FuelInventory saved = fuelInventoryRepository.save(inventory);
        if (opening.signum() > 0) {
            recordMovement(saved, "OPENING_BALANCE", opening, ZERO, opening, "Initial station stock", currentActor());
        }
        auditLogService.record("FuelInventory", "CREATE", null,
                "inventoryId=" + saved.getInventoryId() + ", stationId=" + station.getStationId()
                        + ", fuelType=" + type.getCode() + ", stockLitres=" + opening
                        + ", pricePerLitre=" + saved.getPricePerLitre());
        notifyLowStockIfCrossed(saved, false);
        return saved;
    }

    @Transactional
    public FuelInventory updateInventory(Integer inventoryId, FuelInventoryRequest request) {
        if (request == null || request.capacityLitres() == null || request.lowStockThreshold() == null
                || request.pricePerLitre() == null) {
            throw new IllegalArgumentException("Capacity, low-stock threshold, and price are required");
        }
        FuelInventory inventory = fuelInventoryRepository.lockById(inventoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fuel inventory not found"));
        BigDecimal capacity = amount(request.capacityLitres());
        BigDecimal threshold = amount(request.lowStockThreshold());
        BigDecimal price = amount(request.pricePerLitre());
        if (capacity.signum() <= 0 || threshold.signum() < 0 || price.signum() <= 0) {
            throw new IllegalArgumentException("Capacity and price must be greater than zero; threshold cannot be negative");
        }
        if (capacity.compareTo(inventory.getStockLitres()) < 0) {
            throw new IllegalArgumentException("Capacity cannot be lower than current stock");
        }
        boolean wasLowStock = inventory.isLowStock();
        String oldValue = "capacity=" + inventory.getCapacityLitres() + ", threshold=" + inventory.getLowStockThreshold()
                + ", price=" + inventory.getPricePerLitre();
        inventory.setCapacityLitres(capacity);
        inventory.setLowStockThreshold(threshold);
        inventory.setPricePerLitre(price);
        inventory.setUpdatedBy(currentActor());
        inventory.setUpdatedAt(LocalDateTime.now());
        FuelInventory saved = fuelInventoryRepository.save(inventory);
        auditLogService.record("FuelInventory", "UPDATE", oldValue,
                "inventoryId=" + inventoryId + ", capacity=" + capacity + ", threshold=" + threshold
                        + ", price=" + price);
        notifyLowStockIfCrossed(saved, wasLowStock);
        return saved;
    }

    @Transactional
    public FuelInventory updateStock(Integer inventoryId, FuelStockUpdateRequest request) {
        if (request == null || request.quantityDelta() == null || request.quantityDelta().signum() == 0
                || request.reason() == null || request.reason().isBlank()) {
            throw new IllegalArgumentException("A non-zero stock change and reason are required");
        }
        FuelInventory inventory = fuelInventoryRepository.lockById(inventoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fuel inventory not found"));
        BigDecimal delta = amount(request.quantityDelta());
        if (delta.signum() == 0) throw new IllegalArgumentException("Stock change must be at least 0.01 litres");
        BigDecimal before = inventory.getStockLitres();
        boolean wasLowStock = inventory.isLowStock();
        BigDecimal after = before.add(delta);
        if (after.compareTo(inventory.getReservedLitres()) < 0) {
            throw new IllegalArgumentException("Stock cannot be reduced below the amount reserved for pending fuel logs");
        }
        if (after.signum() < 0) {
            throw new IllegalArgumentException("Fuel stock cannot become negative");
        }
        if (after.compareTo(inventory.getCapacityLitres()) > 0) {
            throw new IllegalArgumentException("Stock cannot exceed the tank capacity");
        }
        inventory.setStockLitres(after);
        inventory.setUpdatedBy(currentActor());
        inventory.setUpdatedAt(LocalDateTime.now());
        FuelInventory saved = fuelInventoryRepository.save(inventory);
        String action = delta.signum() > 0 ? "STOCK_IN" : "STOCK_ADJUSTMENT";
        recordMovement(saved, action, delta, before, after, request.reason().trim(), currentActor());
        auditLogService.record("FuelInventory", action, "stockLitres=" + before,
                "inventoryId=" + inventoryId + ", stockLitres=" + after + ", change=" + delta
                        + ", reason=" + request.reason().trim());
        notifyLowStockIfCrossed(saved, wasLowStock);
        return saved;
    }

    public List<FuelLog> getFuelLogsByVehicle(Integer vehicleId) {
        return fuelLogRepository.findByVehicle_VehicleId(vehicleId);
    }

    public List<FuelLog> getFuelLogsByStation(Integer stationId) {
        return fuelLogRepository.findByStation_StationId(stationId);
    }

    @Transactional
    public FuelLog recordFuelLog(FuelLog fuelLog) {
        if (fuelLog.getQuantity() == null || fuelLog.getQuantity().signum() <= 0) {
            throw new IllegalArgumentException("Invalid amount: Liters must be greater than zero.");
        }
        BigDecimal quantity = amount(fuelLog.getQuantity());
        if (quantity.compareTo(MAX_FUEL_LOG_QUANTITY) > 0) {
            throw new IllegalArgumentException("Amount exceeds vehicle capacity. Maximum fuel log amount is 200 liters.");
        }
        if (fuelLog.getVehicle() == null || fuelLog.getVehicle().getVehicleId() == null) {
            throw new IllegalArgumentException("Select a vehicle");
        }
        if (fuelLog.getStation() == null || fuelLog.getStation().getStationId() == null) {
            throw new IllegalArgumentException("Select a fuel station");
        }
        Vehicle vehicle = vehicleRepository.findById(fuelLog.getVehicle().getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
        FuelStation station = fuelStationRepository.findById(fuelLog.getStation().getStationId())
                .orElseThrow(() -> new IllegalArgumentException("Fuel station was not found"));
        FuelType type = fuelTypeRepository.findByCodeIgnoreCase(Optional.ofNullable(fuelLog.getFuelType()).orElse("").trim())
                .filter(item -> "ACTIVE".equals(item.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("Select an available fuel type"));
        FuelInventory inventory = fuelInventoryRepository.lockByStationAndFuelType(station.getStationId(), type.getFuelTypeId())
                .orElseThrow(() -> new IllegalArgumentException("This fuel type is not configured at the selected station"));
        if (inventory.getAvailableLitres().compareTo(quantity) < 0) {
            throw new IllegalArgumentException("Insufficient available stock at this station");
        }

        if (fuelLog.getOdometer() == null || fuelLog.getOdometer() < 0) {
            throw new IllegalArgumentException("Enter a valid current odometer reading");
        }
        if (vehicle.getMileage() != null && fuelLog.getOdometer() < vehicle.getMileage()) {
            throw new IllegalArgumentException("Validation Error: Odometer reading cannot be lower than the current vehicle mileage.");
        }
        if (vehicle.getMileage() == null || fuelLog.getOdometer() > vehicle.getMileage()) {
            vehicle.setMileage(fuelLog.getOdometer());
            vehicleRepository.save(vehicle);
        }

        User actor = currentActor();
        boolean wasLowStock = inventory.isLowStock();
        BigDecimal availableBefore = inventory.getAvailableLitres();
        inventory.setReservedLitres(inventory.getReservedLitres().add(quantity));
        inventory.setUpdatedAt(LocalDateTime.now());
        inventory.setUpdatedBy(actor);
        fuelInventoryRepository.save(inventory);

        fuelLog.setVehicle(vehicle);
        fuelLog.setStation(station);
        fuelLog.setFuelType(type.getCode());
        fuelLog.setQuantity(quantity);
        fuelLog.setCost(quantity.multiply(inventory.getPricePerLitre()).setScale(2, RoundingMode.HALF_UP));
        fuelLog.setStatus("PENDING");
        fuelLog.setRecordedAt(LocalDateTime.now());
        FuelLog saved = fuelLogRepository.save(fuelLog);
        recordMovement(inventory, "RESERVE", quantity, inventory.getStockLitres(), inventory.getStockLitres(),
                "Reserved for pending fuel log " + saved.getLogId() + " (available before: " + availableBefore + " L)", actor);
        auditLogService.record("FuelLog", "CREATE", null, "logId=" + saved.getLogId()
                + ", vehicleId=" + vehicle.getVehicleId() + ", quantity=" + saved.getQuantity()
                + ", stationId=" + station.getStationId() + ", status=PENDING");
        notificationService.sendSystemNotification(vehicle.getOwner(), "Refuel recorded",
                "A refuel was recorded for your vehicle.\n"
                        + "Fuel log ID: " + saved.getLogId() + "\n"
                        + "Vehicle: " + vehicle.getRegNo() + "\n"
                        + "Fuel station: " + station.getName() + " (" + station.getLocation() + ")\n"
                        + "Fuel: " + type.getName() + "\n"
                        + "Litres: " + saved.getQuantity() + "\n"
                        + "Amount: LKR " + saved.getCost() + "\n"
                        + "Current odometer: " + saved.getOdometer() + " km\nStatus: PENDING");
        notifyLowStockIfCrossed(inventory, wasLowStock);
        return saved;
    }

    @Transactional
    public FuelLog updateFuelLogStatus(Integer logId, String status) {
        if (!"APPROVED".equals(status) && !"REJECTED".equals(status)) {
            throw new IllegalArgumentException("Fuel logs can only be approved or rejected");
        }
        FuelLog log = fuelLogRepository.findById(logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fuel log not found: " + logId));
        if (!"PENDING".equals(log.getStatus())) {
            throw new IllegalArgumentException("Only pending fuel logs can be updated");
        }
        FuelType type = fuelTypeRepository.findByCodeIgnoreCase(log.getFuelType())
                .orElseThrow(() -> new IllegalStateException("Fuel type for this log is no longer available"));
        FuelInventory inventory = fuelInventoryRepository.lockByStationAndFuelType(
                        log.getStation().getStationId(), type.getFuelTypeId())
                .orElseThrow(() -> new IllegalStateException("Fuel inventory for this log was not found"));
        User actor = currentActor();
        boolean wasLowStock = inventory.isLowStock();
        BigDecimal before = inventory.getStockLitres();
        if (inventory.getReservedLitres().compareTo(log.getQuantity()) < 0) {
            throw new IllegalStateException("Fuel reservation is inconsistent; inventory was not changed");
        }
        inventory.setReservedLitres(inventory.getReservedLitres().subtract(log.getQuantity()));
        if ("APPROVED".equals(status)) {
            if (inventory.getStockLitres().compareTo(log.getQuantity()) < 0) {
                throw new IllegalStateException("Insufficient stock to approve this fuel log");
            }
            inventory.setStockLitres(inventory.getStockLitres().subtract(log.getQuantity()));
            log.setApprovedBy(actor);
            log.setApprovedAt(LocalDateTime.now());
        }
        inventory.setUpdatedBy(actor);
        inventory.setUpdatedAt(LocalDateTime.now());
        fuelInventoryRepository.save(inventory);
        log.setStatus(status);
        FuelLog saved = fuelLogRepository.save(log);
        if ("APPROVED".equals(status)) {
            recordMovement(inventory, "DISPENSE", log.getQuantity().negate(), before,
                    inventory.getStockLitres(), "Approved fuel log " + logId, actor);
        } else {
            recordMovement(inventory, "RELEASE", BigDecimal.ZERO, before, before,
                    "Rejected fuel log " + logId + "; released " + log.getQuantity() + " L reservation", actor);
        }
        auditLogService.record("FuelLog", status, "status=PENDING",
                "logId=" + logId + ", status=" + status + ", inventoryId=" + inventory.getInventoryId());
        notificationService.sendSystemNotification(log.getVehicle().getOwner(),
                "Refuel " + status.toLowerCase(), "Fuel log " + logId + " for " + log.getVehicle().getRegNo()
                        + " at " + log.getStation().getName() + " was " + status.toLowerCase()
                        + ". " + log.getQuantity() + " L of " + type.getName() + ".");
        notifyLowStockIfCrossed(inventory, wasLowStock);
        return saved;
    }

    @Transactional
    public void deleteFuelLog(Integer logId) {
        FuelLog log = fuelLogRepository.findById(logId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fuel log not found"));
        if ("APPROVED".equals(log.getStatus())) {
            throw new IllegalArgumentException("Approved fuel logs are part of the dispensing history and cannot be deleted");
        }
        if ("PENDING".equals(log.getStatus())) {
            FuelType type = fuelTypeRepository.findByCodeIgnoreCase(log.getFuelType())
                    .orElseThrow(() -> new IllegalStateException("Fuel type for this log was not found"));
            FuelInventory inventory = fuelInventoryRepository.lockByStationAndFuelType(
                            log.getStation().getStationId(), type.getFuelTypeId())
                    .orElseThrow(() -> new IllegalStateException("Fuel inventory for this log was not found"));
            if (inventory.getReservedLitres().compareTo(log.getQuantity()) < 0) {
                throw new IllegalStateException("Fuel reservation is inconsistent; log was not deleted");
            }
            inventory.setReservedLitres(inventory.getReservedLitres().subtract(log.getQuantity()));
            inventory.setUpdatedAt(LocalDateTime.now());
            inventory.setUpdatedBy(currentActor());
            fuelInventoryRepository.save(inventory);
            recordMovement(inventory, "RELEASE", BigDecimal.ZERO, inventory.getStockLitres(), inventory.getStockLitres(),
                    "Deleted pending fuel log " + logId + "; released " + log.getQuantity() + " L reservation", currentActor());
        }
        auditLogService.record("FuelLog", "DELETE", "logId=" + logId + ", status=" + log.getStatus(), null);
        fuelLogRepository.delete(log);
    }

    @Transactional(readOnly = true)
    public FuelManagementSummary getSummary(String period, Integer stationId) {
        LocalDate today = LocalDate.now();
        LocalDate startDate;
        LocalDate endDate;
        if ("day".equalsIgnoreCase(period)) {
            startDate = today;
            endDate = today.plusDays(1);
        } else if ("month".equalsIgnoreCase(period)) {
            startDate = today.withDayOfMonth(1);
            endDate = startDate.plusMonths(1);
        } else {
            throw new IllegalArgumentException("Report period must be day or month");
        }
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atStartOfDay();
        List<FuelLog> logs = fuelLogRepository.findAll();
        List<FuelLog> stationLogs = logs.stream()
                .filter(log -> stationId == null || Objects.equals(log.getStation().getStationId(), stationId))
                .toList();
        List<FuelLog> approved = stationLogs.stream()
                .filter(log -> "APPROVED".equals(log.getStatus()) || "VERIFIED".equals(log.getStatus()))
                .filter(log -> {
                    LocalDateTime approvedAt = log.getApprovedAt() == null ? log.getRecordedAt() : log.getApprovedAt();
                    return approvedAt != null && !approvedAt.isBefore(start) && approvedAt.isBefore(end);
                })
                .toList();
        long pending = stationLogs.stream().filter(log -> "PENDING".equals(log.getStatus())
                && log.getRecordedAt() != null && !log.getRecordedAt().isBefore(start) && log.getRecordedAt().isBefore(end)).count();
        BigDecimal litres = approved.stream().map(FuelLog::getQuantity).filter(Objects::nonNull)
                .reduce(ZERO, BigDecimal::add);
        BigDecimal sales = approved.stream().map(FuelLog::getCost).filter(Objects::nonNull)
                .reduce(ZERO, BigDecimal::add);
        Map<String, List<FuelLog>> grouped = approved.stream().collect(Collectors.groupingBy(FuelLog::getFuelType));
        List<FuelManagementSummary.TypeSummary> byType = grouped.entrySet().stream()
                .map(entry -> new FuelManagementSummary.TypeSummary(entry.getKey(),
                        entry.getValue().stream().map(FuelLog::getQuantity).filter(Objects::nonNull).reduce(ZERO, BigDecimal::add),
                        entry.getValue().stream().map(FuelLog::getCost).filter(Objects::nonNull).reduce(ZERO, BigDecimal::add),
                        entry.getValue().size()))
                .sorted(Comparator.comparing(FuelManagementSummary.TypeSummary::fuelType)).toList();
        long lowStock = fuelInventoryRepository.findAll().stream()
                .filter(item -> stationId == null || Objects.equals(item.getStation().getStationId(), stationId))
                .filter(FuelInventory::isLowStock).count();
        return new FuelManagementSummary(period.toLowerCase(), approved.size(), pending, litres, sales, lowStock, byType);
    }

    private void recordMovement(FuelInventory inventory, String action, BigDecimal delta, BigDecimal before,
                                BigDecimal after, String reason, User actor) {
        FuelStockMovement movement = new FuelStockMovement();
        movement.setInventory(inventory);
        movement.setAction(action);
        movement.setQuantityDelta(amount(delta));
        movement.setStockBefore(amount(before));
        movement.setStockAfter(amount(after));
        movement.setReason(reason);
        movement.setActor(actor);
        movement.setOccurredAt(LocalDateTime.now());
        fuelStockMovementRepository.save(movement);
    }

    private void notifyLowStockIfCrossed(FuelInventory inventory, boolean wasLowStock) {
        if (wasLowStock || !inventory.isLowStock()) return;
        java.util.Map<Integer, User> recipients = new java.util.LinkedHashMap<>();
        userRepository.findByRoleAndStatus("FUEL_STATION_MANAGER", "ACTIVE")
                .forEach(user -> recipients.put(user.getUserId(), user));
        userRepository.findByRoleAndStatus("ADMIN", "ACTIVE")
                .forEach(user -> recipients.put(user.getUserId(), user));
        String subject = "Low fuel stock: " + inventory.getStation().getName();
        String body = inventory.getFuelType().getName() + " is at " + inventory.getAvailableLitres()
                + " L available at " + inventory.getStation().getName() + ". Reorder threshold: "
                + inventory.getLowStockThreshold() + " L.\nUpdated: " + inventory.getUpdatedAt();
        recipients.values().forEach(user -> notificationService.sendSystemNotification(user, subject, body));
    }

    private User currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("An authenticated user is required for fuel operations");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("Current user was not found"));
    }

    private void validateInventoryRequest(FuelInventoryRequest request) {
        if (request == null || request.stationId() == null || request.fuelTypeId() == null
                || request.openingStockLitres() == null || request.capacityLitres() == null
                || request.lowStockThreshold() == null || request.pricePerLitre() == null) {
            throw new IllegalArgumentException("Station, fuel type, opening stock, capacity, threshold, and price are required");
        }
        BigDecimal stock = amount(request.openingStockLitres());
        BigDecimal capacity = amount(request.capacityLitres());
        BigDecimal threshold = amount(request.lowStockThreshold());
        BigDecimal price = amount(request.pricePerLitre());
        if (stock.signum() < 0 || capacity.signum() <= 0 || stock.compareTo(capacity) > 0
                || threshold.signum() < 0 || threshold.compareTo(capacity) > 0 || price.signum() <= 0) {
            throw new IllegalArgumentException("Stock and threshold must be within capacity; capacity and price must be greater than zero");
        }
    }

    private void validateFuelType(FuelTypeRequest request) {
        if (request == null || request.code() == null || request.name() == null
                || request.code().isBlank() || request.name().isBlank()) {
            throw new IllegalArgumentException("Fuel type code and name are required");
        }
        if (!request.code().trim().matches("[A-Za-z0-9_-]{2,20}")) {
            throw new IllegalArgumentException("Fuel type code must contain 2 to 20 letters, numbers, dashes, or underscores");
        }
        if (request.name().trim().length() > 60) {
            throw new IllegalArgumentException("Fuel type name must be 60 characters or fewer");
        }
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(java.util.Locale.ROOT);
    }

    private void validateStation(FuelStation station) {
        if (station == null || station.getName() == null || station.getName().isBlank()
                || station.getLocation() == null || station.getLocation().isBlank()) {
            throw new IllegalArgumentException("Station name and location are required");
        }
    }

    private BigDecimal amount(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
