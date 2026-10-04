package lk.autoflow.backend.report;

import java.math.BigDecimal;

public record SystemReportSummary(
        long usersTotal,
        long customers,
        long staffAccounts,
        long activeUsers,
        long bookingsTotal,
        long pendingBookings,
        long completedBookings,
        long cancelledBookings,
        long paymentsTotal,
        long completedPayments,
        long failedPayments,
        BigDecimal totalPaymentAmount,
        BigDecimal approvedRefundAmount,
        BigDecimal netPaymentAmount,
        long activeVehicles,
        long serviceCentres,
        long serviceBays,
        long fuelStations,
        long scheduleSlots
) {}
