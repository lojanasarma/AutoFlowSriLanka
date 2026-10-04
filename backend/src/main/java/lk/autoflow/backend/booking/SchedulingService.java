package lk.autoflow.backend.booking;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lk.autoflow.backend.notification.AuditLogService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SchedulingService {

    private final CentreRepository centreRepository;
    private final BayRepository bayRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final AuditLogService auditLogService;

    public List<Centre> getAllCentres() {
        return centreRepository.findAll();
    }

    public List<Bay> getBaysByCentre(Integer centreId) {
        return bayRepository.findByCentre_CentreId(centreId);
    }

    public List<TimeSlot> getAvailableSlotsByCentre(Integer centreId) {
        return timeSlotRepository.findByCentre_CentreId(centreId);
    }

    public List<TimeSlot> getAllSlots() {
        return timeSlotRepository.findAll();
    }

    @Transactional
    public Centre createCentre(Centre centre) {
        validateCentre(centre);
        Centre saved = centreRepository.save(centre);
        auditLogService.record("ServiceCentre", "CREATE", null,
                "centreId=" + saved.getCentreId() + ", name=" + saved.getName());
        return saved;
    }

    @Transactional
    public Centre updateCentre(Integer centreId, Centre details) {
        validateCentre(details);
        Centre centre = centreRepository.findById(centreId)
                .orElseThrow(() -> new IllegalArgumentException("Service centre was not found"));
        String old = "name=" + centre.getName() + ", location=" + centre.getLocation();
        centre.setName(details.getName().trim());
        centre.setLocation(details.getLocation().trim());
        Centre saved = centreRepository.save(centre);
        auditLogService.record("ServiceCentre", "UPDATE", old,
                "centreId=" + centreId + ", name=" + saved.getName() + ", location=" + saved.getLocation());
        return saved;
    }

    @Transactional
    public void deleteCentre(Integer centreId) {
        if (!centreRepository.existsById(centreId)) return;
        if (!bayRepository.findByCentre_CentreId(centreId).isEmpty()
                || !timeSlotRepository.findByCentre_CentreId(centreId).isEmpty()) {
            throw new IllegalArgumentException("This service centre has bays or schedule slots and cannot be deleted");
        }
        centreRepository.deleteById(centreId);
        auditLogService.record("ServiceCentre", "DELETE", "centreId=" + centreId, null);
    }

    @Transactional
    public Bay updateBay(Integer bayId, Bay details) {
        if (details == null || details.getName() == null || details.getName().isBlank()) {
            throw new IllegalArgumentException("Bay name is required");
        }
        Bay bay = bayRepository.findById(bayId)
                .orElseThrow(() -> new IllegalArgumentException("Service bay was not found"));
        String old = "name=" + bay.getName() + ", status=" + bay.getStatus();
        bay.setName(details.getName().trim());
        if (details.getStatus() != null) {
            if (!List.of("AVAILABLE", "INACTIVE").contains(details.getStatus())) {
                throw new IllegalArgumentException("Select a supported bay status");
            }
            bay.setStatus(details.getStatus());
        }
        Bay saved = bayRepository.save(bay);
        auditLogService.record("ServiceBay", "UPDATE", old,
                "bayId=" + bayId + ", name=" + saved.getName() + ", status=" + saved.getStatus());
        return saved;
    }

    @Transactional
    public void deleteBay(Integer bayId) {
        if (!bayRepository.existsById(bayId)) return;
        if (!timeSlotRepository.findByBay_BayId(bayId).isEmpty()) {
            throw new IllegalArgumentException("This service bay has schedule slots and cannot be deleted");
        }
        bayRepository.deleteById(bayId);
        auditLogService.record("ServiceBay", "DELETE", "bayId=" + bayId, null);
    }

    private void validateCentre(Centre centre) {
        if (centre == null || centre.getName() == null || centre.getName().isBlank()
                || centre.getLocation() == null || centre.getLocation().isBlank()) {
            throw new IllegalArgumentException("Service centre name and location are required");
        }
    }

    @Transactional
    public TimeSlot createTimeSlot(TimeSlot timeSlot) {
        if (timeSlot == null || timeSlot.getCentre() == null || timeSlot.getCentre().getCentreId() == null
                || timeSlot.getBay() == null || timeSlot.getBay().getBayId() == null
                || timeSlot.getStartAt() == null || timeSlot.getEndAt() == null) {
            throw new IllegalArgumentException("Centre, bay, start time, and end time are required");
        }
        if (!timeSlot.getEndAt().isAfter(timeSlot.getStartAt())
                || !timeSlot.getStartAt().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("A schedule slot must have a future start and a later end time");
        }
        Centre centre = centreRepository.findById(timeSlot.getCentre().getCentreId())
                .orElseThrow(() -> new IllegalArgumentException("Service centre was not found"));
        Bay bay = bayRepository.findById(timeSlot.getBay().getBayId())
                .orElseThrow(() -> new IllegalArgumentException("Service bay was not found"));
        if (!bay.getCentre().getCentreId().equals(centre.getCentreId()) || !"AVAILABLE".equals(bay.getStatus())) {
            throw new IllegalArgumentException("Select an available bay from the selected service centre");
        }
        if (timeSlotRepository.existsOverlappingSlot(bay.getBayId(), timeSlot.getStartAt(), timeSlot.getEndAt())) {
            throw new IllegalArgumentException("The selected bay already has a slot during this time");
        }
        timeSlot.setCentre(centre);
        timeSlot.setBay(bay);
        timeSlot.setStatus("AVAILABLE");
        TimeSlot saved = timeSlotRepository.save(timeSlot);
        auditLogService.record("TimeSlot", "CREATE", null, "slotId=" + saved.getSlotId()
                + ", bayId=" + saved.getBay().getBayId() + ", startAt=" + saved.getStartAt());
        return saved;
    }

    @Transactional
    public Bay createBay(Bay bay) {
        if (bay.getCentre() == null || bay.getCentre().getCentreId() == null) {
            throw new IllegalArgumentException("A service centre is required for this bay");
        }
        Centre centre = centreRepository.findById(bay.getCentre().getCentreId())
                .orElseThrow(() -> new IllegalArgumentException("Service centre was not found"));
        if (bay.getName() == null || bay.getName().isBlank()) {
            throw new IllegalArgumentException("Bay name is required");
        }
        if (bay.getStatus() != null && !List.of("AVAILABLE", "INACTIVE").contains(bay.getStatus())) {
            throw new IllegalArgumentException("Select a supported bay status");
        }
        bay.setCentre(centre);
        if (bay.getStatus() == null) {
            bay.setStatus("AVAILABLE");
        }
        Bay saved = bayRepository.save(bay);
        auditLogService.record("ServiceBay", "CREATE", null,
                "bayId=" + saved.getBayId() + ", name=" + saved.getName());
        return saved;
    }
}
