package lk.autoflow.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BayRepository extends JpaRepository<Bay, Integer> {
    List<Bay> findByCentre_CentreId(Integer centreId);
}
