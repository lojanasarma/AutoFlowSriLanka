package lk.autoflow.backend.fuel;

import java.math.BigDecimal;

public record FuelStockUpdateRequest(BigDecimal quantityDelta, String reason) {}
