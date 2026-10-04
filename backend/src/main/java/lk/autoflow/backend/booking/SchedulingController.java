package lk.autoflow.backend.booking;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/scheduling")
@RequiredArgsConstructor
public class SchedulingController {

    private final SchedulingService schedulingService;

    @GetMapping("/centres")
    public ResponseEntity<List<Centre>> getAllCentres() {
        return ResponseEntity.ok(schedulingService.getAllCentres());
    }

    @PostMapping("/centres")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCentre(@RequestBody Centre centre) {
        try { return ResponseEntity.ok(schedulingService.createCentre(centre)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PutMapping("/centres/{centreId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCentre(@PathVariable Integer centreId, @RequestBody Centre centre) {
        try { return ResponseEntity.ok(schedulingService.updateCentre(centreId, centre)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @DeleteMapping("/centres/{centreId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCentre(@PathVariable Integer centreId) {
        try { schedulingService.deleteCentre(centreId); return ResponseEntity.noContent().build(); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @GetMapping("/bays")
    public ResponseEntity<List<Bay>> getBaysByCentre(@RequestParam Integer centreId) {
        return ResponseEntity.ok(schedulingService.getBaysByCentre(centreId));
    }

    @GetMapping("/slots")
    public ResponseEntity<List<TimeSlot>> getSlots(@RequestParam(required = false) Integer centreId) {
        if (centreId != null) {
            return ResponseEntity.ok(schedulingService.getAvailableSlotsByCentre(centreId));
        }
        return ResponseEntity.ok(schedulingService.getAllSlots());
    }

    @PostMapping("/slots")
    @PreAuthorize("hasAnyRole('ADMIN', 'SCHEDULING_OFFICER')")
    public ResponseEntity<?> createTimeSlot(@RequestBody TimeSlot timeSlot) {
        try { return ResponseEntity.ok(schedulingService.createTimeSlot(timeSlot)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PostMapping("/bays")
    @PreAuthorize("hasAnyRole('ADMIN', 'SCHEDULING_OFFICER')")
    public ResponseEntity<?> createBay(@RequestBody Bay bay) {
        try { return ResponseEntity.ok(schedulingService.createBay(bay)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PutMapping("/bays/{bayId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateBay(@PathVariable Integer bayId, @RequestBody Bay bay) {
        try { return ResponseEntity.ok(schedulingService.updateBay(bayId, bay)); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @DeleteMapping("/bays/{bayId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteBay(@PathVariable Integer bayId) {
        try { schedulingService.deleteBay(bayId); return ResponseEntity.noContent().build(); }
        catch (IllegalArgumentException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }
}
