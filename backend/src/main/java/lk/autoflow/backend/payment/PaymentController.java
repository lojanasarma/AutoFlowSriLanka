package lk.autoflow.backend.payment;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<List<Payment>> getPaymentsByBooking(@PathVariable Integer bookingId) {
        return ResponseEntity.ok(paymentService.getPaymentsByBooking(bookingId));
    }

    @GetMapping("/my-payments")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'USER')")
    public ResponseEntity<List<Payment>> getMyPayments(@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        return ResponseEntity.ok(paymentService.getMyPayments(userDetails.getUsername()));
    }

    @GetMapping("/{paymentId}/invoice")
    @PreAuthorize("@accessPolicy.canAccessPayment(#paymentId, authentication)")
    public ResponseEntity<Invoice> getInvoiceByPayment(@PathVariable Integer paymentId) {
        return paymentService.getInvoiceByPayment(paymentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{paymentId}/refundable-balance")
    @PreAuthorize("@accessPolicy.canAccessPayment(#paymentId, authentication)")
    public ResponseEntity<java.math.BigDecimal> getRefundableBalance(@PathVariable Integer paymentId) {
        return ResponseEntity.ok(paymentService.getRefundableAmount(paymentId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER') or (#payment.booking != null and @accessPolicy.canAccessBooking(#payment.booking.bookingId, authentication))")
    public ResponseEntity<?> initiatePayment(@RequestBody Payment payment) {
        try {
            return ResponseEntity.ok(paymentService.processPayment(payment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{paymentId}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<Payment> verifyPayment(@PathVariable Integer paymentId) {
        try {
            return ResponseEntity.ok(paymentService.verifyPayment(paymentId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/refund")
    @PreAuthorize("hasRole('FINANCE_OFFICER')")
    public ResponseEntity<?> requestRefund(@RequestBody RefundRequest refund,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            return ResponseEntity.ok(paymentService.requestRefund(refund, userDetails.getUsername()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{paymentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePayment(@PathVariable Integer paymentId) {
        paymentService.deletePayment(paymentId);
        return ResponseEntity.noContent().build();
    }
}
