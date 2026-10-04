package lk.autoflow.backend.vehicle;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'WORKSHOP_OPERATIONS_MANAGER', 'SCHEDULING_OFFICER', 'FUEL_STATION_MANAGER')")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/reg/{regNo}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'SCHEDULING_OFFICER', 'WORKSHOP_OPERATIONS_MANAGER')")
    public ResponseEntity<Vehicle> getVehicleByRegNo(@PathVariable String regNo) {
        return vehicleService.getVehicleByRegNo(regNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'WORKSHOP_OPERATIONS_MANAGER', 'SCHEDULING_OFFICER')")
    public ResponseEntity<List<Vehicle>> getVehiclesByOwner(@PathVariable Integer ownerId) {
        return ResponseEntity.ok(vehicleService.getVehiclesByOwner(ownerId));
    }

    @GetMapping("/my-garage")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'USER')")
    public ResponseEntity<List<Vehicle>> getMyGarage(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(vehicleService.getMyVehicles(userDetails.getUsername()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'CUSTOMER', 'USER')")
    public ResponseEntity<?> createVehicle(@RequestBody lk.autoflow.backend.dto.VehicleCreateDTO dto, @AuthenticationPrincipal UserDetails userDetails) {
        try {
            boolean customer = userDetails.getAuthorities().stream()
                    .anyMatch(authority -> "ROLE_CUSTOMER".equals(authority.getAuthority())
                            || "ROLE_USER".equals(authority.getAuthority()));
            if (customer) {
                // Ignore a client-supplied ownerId; customers may only add vehicles to their own garage.
                dto.setOwnerId(null);
            }
            return ResponseEntity.ok(vehicleService.createVehicle(userDetails.getUsername(), dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateVehicle(@PathVariable Integer id, @RequestBody Vehicle vehicle) {
        try {
            return ResponseEntity.ok(vehicleService.updateVehicle(id, vehicle));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Integer id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.ok().build();
    }
}
