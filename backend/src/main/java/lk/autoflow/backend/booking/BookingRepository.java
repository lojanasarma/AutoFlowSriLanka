package lk.autoflow.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {
    Optional<Booking> findByRef(String ref);
    List<Booking> findByCustomer_UserId(Integer customerId);
    boolean existsByBookingIdAndCustomer_UserId(Integer bookingId, Integer customerId);
    boolean existsByCustomer_UserId(Integer customerId);
    List<Booking> findByVehicle_VehicleId(Integer vehicleId);
    List<Booking> findByCentre_CentreId(Integer centreId);
    List<Booking> findByStatus(String status);

    @Query("select case when count(b) > 0 then true else false end from Booking b " +
            "where b.slot.bay.bayId = :bayId and b.slot.startAt < :endAt and b.slot.endAt > :startAt " +
            "and b.status <> 'CANCELLED'")
    boolean existsActiveBookingForBayAndTime(@Param("bayId") Integer bayId,
            @Param("startAt") LocalDateTime startAt, @Param("endAt") LocalDateTime endAt);
}
