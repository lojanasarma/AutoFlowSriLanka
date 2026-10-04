package lk.autoflow.backend.fuel;

import java.math.BigDecimal;

public record FuelInventoryRequest(Integer stationId, Integer fuelTypeId, BigDecimal openingStockLitres,
                                   BigDecimal capacityLitres, BigDecimal lowStockThreshold,
                                   BigDecimal pricePerLitre) {}
