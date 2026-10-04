package lk.autoflow.backend.payment;

import lombok.RequiredArgsConstructor;
import lk.autoflow.backend.notification.AuditLogService;
import lk.autoflow.backend.user.Staff;
import lk.autoflow.backend.user.User;
import lk.autoflow.backend.user.UserRepository;
import lk.autoflow.backend.notification.NotificationService;
import lk.autoflow.backend.booking.BookingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final java.util.Set<String> SUPPORTED_METHODS = java.util.Set.of("CASH", "CARD", "BANK_TRANSFER");

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final RefundRepository refundRepository;
    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final BookingRepository bookingRepository;

    public List<Payment> getPaymentsByBooking(Integer bookingId) {
        return paymentRepository.findByBooking_BookingId(bookingId);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Optional<Invoice> getInvoiceByPayment(Integer paymentId) {
        return invoiceRepository.findByPayment_PaymentId(paymentId);
    }

    public List<Payment> getMyPayments(String email) {
        return paymentRepository.findByBooking_Customer_Email(email);
    }

    @Transactional
    public Payment processPayment(Payment payment) {
        if (payment.getBooking() == null || payment.getBooking().getBookingId() == null) {
            throw new IllegalArgumentException("A booking is required for payment");
        }
        payment.setBooking(bookingRepository.findById(payment.getBooking().getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Booking was not found")));
        if (payment.getAmount() == null || payment.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }
        if (payment.getMethod() == null || !SUPPORTED_METHODS.contains(payment.getMethod())) {
            throw new IllegalArgumentException("Select a supported payment method");
        }
        if (payment.getProviderRef() != null && !payment.getProviderRef().isBlank()) {
            Optional<Payment> existing = paymentRepository.findByProviderRef(payment.getProviderRef().trim());
            if (existing.isPresent()) {
                Payment previous = existing.get();
                boolean sameRequest = previous.getBooking().getBookingId().equals(payment.getBooking().getBookingId())
                        && previous.getAmount().compareTo(payment.getAmount()) == 0
                        && previous.getMethod().equals(payment.getMethod());
                if (sameRequest) return previous;
                throw new IllegalArgumentException("Payment reference has already been used");
            }
            payment.setProviderRef(payment.getProviderRef().trim());
        } else {
            payment.setProviderRef(null);
        }
        payment.setStatus("PENDING");
        if ("CARD".equals(payment.getMethod())) {
            if ("DECLINED".equalsIgnoreCase(payment.getDemoCardOutcome())) {
                payment.setStatus("FAILED");
                Payment declined = paymentRepository.save(payment);
                auditLogService.record("Payment", "DECLINE", "status=NEW", "status=FAILED");
                notifyCustomer(declined, "Payment failed");
                return declined;
            }
            payment.setStatus("COMPLETED");
            payment.setVerifiedAt(LocalDateTime.now());
            Payment completed = paymentRepository.save(payment);
            createInvoiceIfMissing(completed);
            auditLogService.record("Payment", "CARD_PAYMENT", "status=NEW", "status=COMPLETED");
            notifyCustomer(completed, "Payment completed");
            return completed;
        }
        Payment saved = paymentRepository.save(payment);
        auditLogService.record("Payment", "CREATE", null, "paymentId=" + saved.getPaymentId()
                + ", bookingId=" + saved.getBooking().getBookingId() + ", amount=" + saved.getAmount()
                + ", status=" + saved.getStatus());
        notifyCustomer(saved, "Payment recorded");
        return saved;
    }

    @Transactional
    public Payment verifyPayment(Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if ("COMPLETED".equals(payment.getStatus())) {
            return payment;
        }
        if (!"PENDING".equals(payment.getStatus())) {
            throw new IllegalArgumentException("Only pending payments can be verified");
        }

        String oldStatus = payment.getStatus();
        payment.setStatus("COMPLETED");
        payment.setVerifiedAt(LocalDateTime.now());
        Payment savedPayment = paymentRepository.save(payment);

        auditLogService.record("Payment", "VERIFY", "status=" + oldStatus, "status=COMPLETED");

        // Auto-generate Invoice if it's completed
        createInvoiceIfMissing(savedPayment);
        notifyCustomer(savedPayment, "Payment completed");

        return savedPayment;
    }

    @Transactional
    public Refund requestRefund(RefundRequest request, String actorEmail) {
        if (request.paymentId() == null || request.amount() == null || request.reason() == null || request.reason().isBlank()) {
            throw new IllegalArgumentException("Payment, amount and reason are required");
        }
        Payment payment = paymentRepository.findById(request.paymentId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Payment not found"));
        if (!"COMPLETED".equals(payment.getStatus())) {
            throw new IllegalArgumentException("Only completed payments can be refunded");
        }
        if (payment.getAmount() == null) {
            throw new IllegalArgumentException("Payment has no refundable amount");
        }
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new RuntimeException("Staff user not found"));
        if (!(actor instanceof Staff staff)) {
            throw new IllegalArgumentException("Refunds must be processed by a staff account");
        }
        BigDecimal alreadyRefunded = refundRepository.findByPayment_PaymentId(payment.getPaymentId()).stream()
                .filter(existing -> "APPROVED".equals(existing.getStatus()) && existing.getAmount() != null)
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remaining = payment.getAmount().subtract(alreadyRefunded);
        if (request.amount().signum() <= 0 || request.amount().compareTo(remaining) > 0) {
            throw new IllegalArgumentException("Refund amount exceeds the remaining refundable balance");
        }

        Refund refund = new Refund();
        refund.setPayment(payment);
        refund.setAmount(request.amount());
        refund.setReason(request.reason().trim());
        refund.setDecidedBy(staff);
        refund.setStatus("APPROVED");
        Refund savedRefund = refundRepository.save(refund);
        BigDecimal totalRefunded = alreadyRefunded.add(request.amount());
        if (totalRefunded.compareTo(payment.getAmount()) >= 0) {
            payment.setStatus("REFUNDED");
            paymentRepository.save(payment);
        }
        auditLogService.record("Refund", "APPROVE", "status=PENDING", "refundId=" + savedRefund.getRefundId()
                + ", amount=" + request.amount() + ", paymentId=" + payment.getPaymentId(), actor);
        return savedRefund;
    }

    public BigDecimal getRefundableAmount(Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Payment not found"));
        if (!"COMPLETED".equals(payment.getStatus())) return BigDecimal.ZERO;
        BigDecimal refunded = refundRepository.findByPayment_PaymentId(paymentId).stream()
                .filter(item -> "APPROVED".equals(item.getStatus()) && item.getAmount() != null)
                .map(Refund::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return payment.getAmount().subtract(refunded).max(BigDecimal.ZERO);
    }

    private void createInvoiceIfMissing(Payment payment) {
        if (invoiceRepository.findByPayment_PaymentId(payment.getPaymentId()).isEmpty()) {
            Invoice invoice = new Invoice();
            invoice.setPayment(payment);
            invoice.setAmount(payment.getAmount());
            invoiceRepository.save(invoice);
        }
    }

    private void notifyCustomer(Payment payment, String title) {
        var booking = payment.getBooking();
        notificationService.sendSystemNotification(booking.getCustomer(), title,
                "Payment " + payment.getStatus().toLowerCase(java.util.Locale.ROOT) + ".\n"
                        + "Payment ID: " + payment.getPaymentId() + "\n"
                        + "Booking ID: " + booking.getBookingId() + " (" + booking.getRef() + ")\n"
                        + "Amount: LKR " + payment.getAmount() + "\n"
                        + "Method: " + payment.getMethod() + "\n"
                        + "Status: " + payment.getStatus());
    }

    @Transactional
    public void deletePayment(Integer paymentId) {
        paymentRepository.findById(paymentId).ifPresent(payment -> {
            paymentRepository.delete(payment);
            auditLogService.record("Payment", "DELETE", "paymentId=" + paymentId + ", status=" + payment.getStatus(), null);
        });
    }
}
