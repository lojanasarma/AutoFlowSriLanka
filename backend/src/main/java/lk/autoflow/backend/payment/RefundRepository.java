package lk.autoflow.backend.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Integer> {
    List<Refund> findByPayment_PaymentId(Integer paymentId);
    List<Refund> findByStatus(String status);

    @Query("select coalesce(sum(r.amount), 0) from Refund r where r.status = 'APPROVED'")
    BigDecimal sumApprovedAmounts();
    boolean existsByDecidedBy_UserId(Integer userId);
}
