import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../services/vehicleService';
import { bookingService } from '../services/bookingService';
import { reportService } from '../services/reportService';

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      if (currentUser.role === 'CUSTOMER') {
        navigate('/vehicles', { replace: true });
        return;
      }
      try {
        const vehicleRows = currentUser.role === 'CUSTOMER'
          ? await vehicleService.getMyGarage() : await vehicleService.getAllVehicles();
        setVehicles(vehicleRows || []);
        if (currentUser.role === 'ADMIN') {
          const bookingRows = await bookingService.getAllBookings();
          setBookings(bookingRows || []);
          try { setSummary(await reportService.getSummary()); }
          catch (error) { console.error('Could not load system summary', error); }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  if (currentUser?.role === 'CUSTOMER') { return null; }
  const firstName = currentUser?.fullName?.split(' ')[0] || 'CUSTOMER';
  const vehicleCount = summary?.activeVehicles ?? vehicles.length;
  const bookingCount = summary?.bookingsTotal ?? bookings.length;
  const netPaymentValue = Number(summary?.netPaymentAmount || 0);

  return (
    <div id="panel-dashboard" className="panel on">
      <div className="sh">
        <div className="sh-eye">Fleet Intelligence</div>
        <h1>Welcome back, <span style={{ color: 'var(--blue)' }}>{firstName}</span></h1>
        <div className="sh-sub">System overview — {vehicleCount} active vehicle(s)</div>
      </div>

      <div className="sg sg-3 mb">
        <div className="sc">
          <span className="sc-icon">🚗</span>
          <div className="sc-label">Fleet Size</div>
          <div className="sc-val">{vehicleCount}</div>
          <div className="sc-sub">Active vehicles registered</div>
        </div>
        <div className="sc">
          <span className="sc-icon">🔧</span>
          <div className="sc-label">Service Records</div>
          <div className="sc-val">{bookingCount}</div>
          <div className="sc-sub">System-wide bookings</div>
        </div>
        <div className="sc">
          <span className="sc-icon">💰</span>
          <div className="sc-label">Total Spent</div>
          <div className="sc-val sm">Rs.{netPaymentValue.toLocaleString('en-LK', { maximumFractionDigits: 0 })}</div>
          <div className="sc-sub">Net completed payments</div>
        </div>

      </div>

      <div className="g2 mb">
        {/* Activity Timeline */}
        <div className="card">
          <div className="ch">
            <div className="ct">Recent Activity</div>
            <span className="ca" onClick={() => navigate('/booking')}>Full log ➔</span>
          </div>
          
          {bookings.length > 0 ? (
            <div className="tl">
              {bookings.slice(0, 5).map((b, i) => (
                <div className="tl-item" key={i}>
                  <div className="tl-dot td-bl">📅</div>
                  <div className="tl-body">
                    <div className="tl-title">{b.description || 'Service Booking'} — {b.vehicleLicensePlate}</div>
                    <div className="tl-meta">{new Date(b.bookingDate).toLocaleDateString()} • {b.status}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ padding: '28px 16px' }}>
              <div className="empty-ic" style={{ fontSize: '28px' }}>🔧</div>
              <div className="empty-tx" style={{ fontSize: '12px' }}>No service activity yet</div>
            </div>
          )}
        </div>

        {/* Fleet Status + Reminders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card">
            <div className="ch"><div className="ct">Upcoming Services</div></div>
            {bookings.filter(b => ['PENDING', 'SCHEDULED'].includes(b.status)).slice(0, 4).map(b => (
              <div className="mr" key={b.bookingId}>
                <span className="mr-name">{b.ref || b.bookingRef} · {b.serviceType}</span>
                <span className="mr-val">{b.slot?.startAt ? new Date(b.slot.startAt).toLocaleDateString() : b.status}</span>
              </div>
            ))}
            {!bookings.some(b => ['PENDING', 'SCHEDULED'].includes(b.status)) && <div className="empty" style={{ padding: '18px 12px' }}><div className="empty-tx" style={{ fontSize: '12px' }}>No pending or scheduled services</div></div>}
          </div>
          <div className="card">
            <div className="ch"><div className="ct">Spend Overview</div></div>
            <div className="mr"><span className="mr-name">Payment value</span><span className="mr-val">Rs. {Number(summary?.totalPaymentAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
            <div className="mr"><span className="mr-name">Approved refunds</span><span className="mr-val">Rs. {Number(summary?.approvedRefundAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span></div>
            <div className="mr"><span className="mr-name">Service records</span><span className="mr-val">{bookingCount}</span></div>
          </div>
        </div>
      </div>

      {/* Fleet Health */}
      {vehicles.length > 0 && (
        <div className="card">
          <div className="ch">
            <div className="ct">Fleet Health Monitor</div>
            <span className="ca" onClick={() => navigate('/vehicles')}>Manage fleet ➔</span>
          </div>
          <div className="g3" style={{ marginBottom: 0 }}>
            {vehicles.slice(0, 3).map((v, i) => (
              <div key={i}>
                <div className="ch" style={{ marginBottom: '9px' }}>
                  <span className="ct">{v.make} {v.model}</span>
                  <span className="badge b-gr">Active</span>
                </div>
                <div className="mr" style={{ padding: '6px 0' }}>
                  <span className="mr-name">Plate</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', fontWeight: 700, color: 'var(--blue)' }}>{v.regNo || v.registrationNo}</span>
                </div>
                <div className="mr" style={{ padding: '6px 0' }}>
                  <span className="mr-name">Mileage</span>
                  <span className="mr-val">{v.mileage || v.currentOdometer || 0} km</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', margin: '10px 0 3px', fontFamily: "'DM Mono', monospace", display: 'flex', justifyContent: 'space-between' }}>
                  <span>Health</span><span>85%</span>
                </div>
                <div className="prog"><div className="prog-f pf-gr" style={{ width: '85%' }}></div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;



