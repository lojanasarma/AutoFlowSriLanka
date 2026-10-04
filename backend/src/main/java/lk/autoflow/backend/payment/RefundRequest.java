package lk.autoflow.backend.payment;

import java.math.BigDecimal;

public record RefundRequest(Integer paymentId, BigDecimal amount, String reason) {
}
