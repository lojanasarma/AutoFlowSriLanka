package lk.autoflow.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Integer> {
    List<TimeSlot> findByCentre_CentreId(Integer centreId);
    List<TimeSlot> findByBay_BayId(Integer bayId);

    @Query("select case when count(s) > 0 then true else false end from TimeSlot s "
            + "where s.bay.bayId = :bayId and s.startAt < :endAt and s.endAt > :startAt")
    boolean existsOverlappingSlot(@Param("bayId") Integer bayId,
            @Param("startAt") LocalDateTime startAt, @Param("endAt") LocalDateTime endAt);
}
