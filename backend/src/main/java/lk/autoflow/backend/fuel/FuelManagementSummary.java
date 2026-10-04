package lk.autoflow.backend.fuel;

import java.math.BigDecimal;
import java.util.List;

public record FuelManagementSummary(String period, long approvedTransactions, long pendingTransactions,
                                   BigDecimal litresDispensed, BigDecimal salesValue,
                                   long lowStockItems, List<TypeSummary> byFuelType) {
    public record TypeSummary(String fuelType, BigDecimal litres, BigDecimal salesValue, long transactions) {}
}
