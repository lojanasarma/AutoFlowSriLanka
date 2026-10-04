package lk.autoflow.backend.report;

import lk.autoflow.backend.booking.BookingRepository;
import lk.autoflow.backend.booking.BayRepository;
import lk.autoflow.backend.booking.CentreRepository;
import lk.autoflow.backend.booking.TimeSlotRepository;
import lk.autoflow.backend.fuel.FuelStationRepository;
import lk.autoflow.backend.payment.PaymentRepository;
import lk.autoflow.backend.payment.RefundRepository;
import lk.autoflow.backend.user.UserRepository;
import lk.autoflow.backend.vehicle.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class SystemReportService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final VehicleRepository vehicleRepository;
    private final CentreRepository centreRepository;
    private final BayRepository bayRepository;
    private final FuelStationRepository fuelStationRepository;
    private final TimeSlotRepository timeSlotRepository;

    public SystemReportSummary getSummary() {
        BigDecimal payments = paymentRepository.sumCompletedAmounts();
        BigDecimal refunds = refundRepository.sumApprovedAmounts();
        if (payments == null) payments = BigDecimal.ZERO;
        if (refunds == null) refunds = BigDecimal.ZERO;
        return new SystemReportSummary(
                userRepository.count(),
                userRepository.findByRole("CUSTOMER").size(),
                userRepository.findAll().stream().filter(user -> !"CUSTOMER".equals(user.getRole())
                        && !"ADMIN".equals(user.getRole())).count(),
                userRepository.findByStatus("ACTIVE").size(),
                bookingRepository.count(),
                bookingRepository.findByStatus("PENDING").size(),
                bookingRepository.findByStatus("COMPLETED").size(),
                bookingRepository.findByStatus("CANCELLED").size(),
                paymentRepository.count(),
                paymentRepository.findByStatus("COMPLETED").size(),
                paymentRepository.findByStatus("FAILED").size(),
                payments,
                refunds,
                payments.subtract(refunds),
                vehicleRepository.findByStatus("ACTIVE").size(),
                centreRepository.count(),
                bayRepository.count(),
                fuelStationRepository.count(),
                timeSlotRepository.count()
        );
    }
}
