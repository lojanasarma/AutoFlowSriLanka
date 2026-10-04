package lk.autoflow.backend.fuel;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/fuel")
@RequiredArgsConstructor
public class FuelController {

    private final FuelService fuelService;

    @GetMapping("/stations")
    public ResponseEntity<List<FuelStation>> getAllStations() {
        return ResponseEntity.ok(fuelService.getAllStations());
    }

    @GetMapping("/types")
    public ResponseEntity<List<FuelType>> getFuelTypes() {
        return ResponseEntity.ok(fuelService.getFuelTypes());
    }

    @PostMapping("/types")
    @PreAuthorize("hasAnyRole('ADMIN', 'FUEL_STATION_MANAGER')")
    public ResponseEntity<?> createFuelType(@RequestBody FuelTypeRequest request) {
        try { return ResponseEntity.ok(fuelService.createFuelType(request)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PatchMapping("/types/{fuelTypeId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'FUEL_STATION_MANAGER')")
    public ResponseEntity<?> setFuelTypeStatus(@PathVariable Integer fuelTypeId, @RequestParam String status) {
        try { return ResponseEntity.ok(fuelService.setFuelTypeStatus(fuelTypeId, status)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
        catch (org.springframework.web.server.ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<FuelInventory>> getInventory(@RequestParam(required = false) Integer stationId) {
        return ResponseEntity.ok(fuelService.getInventory(stationId));
    }

    @PostMapping("/inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'FUEL_STATION_MANAGER')")
    public ResponseEntity<?> createInventory(@RequestBody FuelInventoryRequest request) {
        try { return ResponseEntity.ok(fuelService.createInventory(request)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PutMapping("/inventory/{inventoryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FUEL_STATION_MANAGER')")
    public ResponseEntity<?> updateInventory(@PathVariable Integer inventoryId, @RequestBody FuelInventoryRequest request) {
        try { return ResponseEntity.ok(fuelService.updateInventory(inventoryId, request)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
        catch (org.springframework.web.server.ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @PostMapping("/inventory/{inventoryId}/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'FUEL_STATION_MANAGER')")
    public ResponseEntity<?> updateStock(@PathVariable Integer inventoryId, @RequestBody FuelStockUpdateRequest request) {
        try { return ResponseEntity.ok(fuelService.updateStock(inventoryId, request)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
        catch (org.springframework.web.server.ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(e.getReason()); }
    }

    @GetMapping("/stock-movements")
    @PreAuthorize("hasAnyRole('ADMIN', 'FUEL_STATION_MANAGER')")
    public ResponseEntity<List<FuelStockMovement>> getStockMovements(@RequestParam(required = false) Integer stationId) {
        return ResponseEntity.ok(fuelService.getStockMovements(stationId));
    }

    @GetMapping("/reports/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'FUEL_STATION_MANAGER')")
    public ResponseEntity<?> getFuelSummary(@RequestParam(defaultValue = "day") String period,
                                            @RequestParam(required = false) Integer stationId) {
        try { return ResponseEntity.ok(fuelService.getSummary(period, stationId)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PostMapping("/stations")
    @PreAuthorize("hasAnyRole('ADMIN', 'FUEL_STATION_MANAGER')")
    public ResponseEntity<?> createStation(@RequestBody FuelStation station) {
        try { return ResponseEntity.ok(fuelService.createStation(station)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PutMapping("/stations/{stationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FUEL_STATION_MANAGER')")
    public ResponseEntity<?> updateStation(@PathVariable Integer stationId, @RequestBody FuelStation station) {
        try { return ResponseEntity.ok(fuelService.updateStation(stationId, station)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @DeleteMapping("/stations/{stationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FUEL_STATION_MANAGER')")
    public ResponseEntity<?> deleteStation(@PathVariable Integer stationId) {
        try { fuelService.deleteStation(stationId); return ResponseEntity.noContent().build(); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @GetMapping("/logs/vehicle/{vehicleId}")
    @PreAuthorize("@accessPolicy.canAccessFuelVehicle(#vehicleId, authentication)")
    public ResponseEntity<List<FuelLog>> getLogsByVehicle(@PathVariable Integer vehicleId) {
        return ResponseEntity.ok(fuelService.getFuelLogsByVehicle(vehicleId));
    }

    @GetMapping("/logs/station/{stationId}")
    @PreAuthorize("hasRole('FUEL_STATION_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<FuelLog>> getLogsByStation(@PathVariable Integer stationId) {
        return ResponseEntity.ok(fuelService.getFuelLogsByStation(stationId));
    }

    @PostMapping("/logs")
    @PreAuthorize("@accessPolicy.canAccessFuelVehicle(#fuelLog.vehicle.vehicleId, authentication)")
    public ResponseEntity<?> recordFuelLog(@RequestBody FuelLog fuelLog) {
        try {
            FuelLog saved = fuelService.recordFuelLog(fuelLog);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PatchMapping("/logs/{logId}/status")
    @PreAuthorize("hasRole('FUEL_STATION_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<FuelLog> updateLogStatus(@PathVariable Integer logId, @RequestParam String status) {
        try {
            return ResponseEntity.ok(fuelService.updateFuelLogStatus(logId, status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (org.springframework.web.server.ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/logs/{logId}")
    @PreAuthorize("hasRole('FUEL_STATION_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteLog(@PathVariable Integer logId) {
        fuelService.deleteFuelLog(logId);
        return ResponseEntity.noContent().build();
    }
}
