import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../services/vehicleService';
import { bookingService } from '../services/bookingService';

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
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
        let vData = [];
        let bData = [];
        if (currentUser.role === 'CUSTOMER') {
          vData = await vehicleService.getMyGarage();
          bData = await bookingService.getMyBookings(); // Assuming this exists or returns []
        } else {
          vData = await vehicleService.getAllVehicles();
          // Assuming staff dashboard might just show empty bookings for now
        }
        setVehicles(vData || []);
        setBookings(bData || []);
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
  const roleText = currentUser?.role === 'CUSTOMER' ? 'Customer' : currentUser?.role;

  return (
    <div id="panel-dashboard" className="panel on">
      <div className="sh">
        <div className="sh-eye">Fleet Intelligence</div>
        <h1>Welcome back, <span style={{ color: 'var(--blue)' }}>{firstName}</span></h1>
        <div className="sh-sub">System ready — {vehicles.length} vehicle(s) in your fleet</div>
      </div>

      <div className="sg sg-3 mb">
        <div className="sc">
          <span className="sc-icon">🚗</span>
          <div className="sc-label">Fleet Size</div>
          <div className="sc-val">{vehicles.length}</div>
          <div className="sc-sub">Vehicles registered</div>
        </div>
        <div className="sc">
          <span className="sc-icon">🔧</span>
          <div className="sc-label">Service Records</div>
          <div className="sc-val">{bookings.length}</div>
          <div className="sc-sub">Total maintenance logs</div>
        </div>
        <div className="sc">
          <span className="sc-icon">💰</span>
          <div className="sc-label">Total Spent</div>
          <div className="sc-val sm">Rs.0</div>
          <div className="sc-sub">Lifetime maintenance</div>
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
            <div className="empty" style={{ padding: '18px 12px' }}>
              <div className="empty-tx" style={{ fontSize: '12px' }}>No upcoming services</div>
            </div>
          </div>
          <div className="card">
            <div className="ch"><div className="ct">Spend Overview</div></div>
            <div className="mr"><span className="mr-name">Total maintenance</span><span className="mr-val">Rs.0</span></div>
            <div className="mr"><span className="mr-name">Service records</span><span className="mr-val">{bookings.length}</span></div>
            <div className="mr"><span className="mr-name">Avg per service</span><span className="mr-val">Rs.0</span></div>
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



