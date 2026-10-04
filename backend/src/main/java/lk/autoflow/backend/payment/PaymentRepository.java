package lk.autoflow.backend.payment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByProviderRef(String providerRef);
    List<Payment> findByBooking_BookingId(Integer bookingId);
    List<Payment> findByStatus(String status);
    List<Payment> findByBooking_Customer_Email(String email);
    boolean existsByPaymentIdAndBooking_Customer_UserId(Integer paymentId, Integer userId);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.status in ('COMPLETED', 'REFUNDED')")
    BigDecimal sumCompletedAmounts();
}
