import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import { reportService } from '../services/reportService';

const Metric = ({ label, value, hint }) => (
  <div className="sc">
    <div className="sc-label">{label}</div>
    <div className="sc-val">{value}</div>
    {hint && <div className="sc-sub">{hint}</div>}
  </div>
);

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      setSummary(await reportService.getSummary());
    } catch (error) {
      message.error('Could not load system reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, []);

  const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="panel on">
      <div className="sh" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="sh-eye">System Overview</div>
          <h1>Reports & Statistics</h1>
          <div className="sh-sub">Live totals from users, bookings, payments, vehicles, and operations.</div>
        </div>
        <button className="btn-go" onClick={loadReport} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>

      {summary && <>
        <div className="sh-eye" style={{ margin: '16px 0 10px' }}>Accounts & Service</div>
        <div className="sg sg-3 mb">
          <Metric label="All Users" value={summary.usersTotal} hint={`${summary.customers} customers · ${summary.staffAccounts} staff`} />
          <Metric label="Active Users" value={summary.activeUsers} />
          <Metric label="Active Vehicles" value={summary.activeVehicles} />
          <Metric label="Service Bookings" value={summary.bookingsTotal} hint={`${summary.pendingBookings} pending · ${summary.completedBookings} completed`} />
          <Metric label="Cancelled Bookings" value={summary.cancelledBookings} />
          <Metric label="Completed Payments" value={summary.completedPayments} hint={`${summary.failedPayments} failed`} />
        </div>

        <div className="sh-eye" style={{ margin: '20px 0 10px' }}>Financial Summary</div>
        <div className="sg sg-3 mb">
          <Metric label="Completed Payment Value" value={money(summary.totalPaymentAmount)} />
          <Metric label="Approved Refunds" value={money(summary.approvedRefundAmount)} />
          <Metric label="Net Payment Value" value={money(summary.netPaymentAmount)} />
          <Metric label="All Payment Records" value={summary.paymentsTotal} />
        </div>

        <div className="sh-eye" style={{ margin: '20px 0 10px' }}>Operations</div>
        <div className="sg sg-3 mb">
          <Metric label="Service Centres / Workshops" value={summary.serviceCentres} />
          <Metric label="Service Bays" value={summary.serviceBays} />
          <Metric label="Fuel Stations" value={summary.fuelStations} />
          <Metric label="Schedule Slots" value={summary.scheduleSlots} />
        </div>
      </>}
    </div>
  );
};

export default Reports;
