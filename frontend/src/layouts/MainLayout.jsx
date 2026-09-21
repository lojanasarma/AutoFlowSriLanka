import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { message } from 'antd';
import './MainLayout.css';
import CursorGlow from '../components/CursorGlow';

const MainLayout = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser(u);
      setEditName(u.fullName || '');
      setEditMobile(u.mobile || '');
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const { userService } = await import('../services/userService');
      const updatedUser = { ...currentUser, fullName: editName, mobile: editMobile };
      const savedUser = await userService.updateMyProfile(updatedUser);
      setCurrentUser(savedUser);
      localStorage.setItem('user', JSON.stringify(savedUser));
      setIsProfileModalVisible(false);
      // Optional success toast could go here
    } catch (error) {
      console.error('Failed to update profile', error);
    }
  };

  useEffect(() => {
    // Canvas particles from friend's dashboard
    const c = canvasRef.current;
    if (!c) return;
    const x = c.getContext('2d');
    let W, H;
    const pts = [];
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    
    for (let i = 0; i < 40; i++) {
      pts.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - .5) * .2,
        vy: (Math.random() - .5) * .2,
        r: Math.random() * 1.5 + .5,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * .015 + .01
      });
    }

    let animationFrameId;
    const frame = () => {
      x.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.ph += p.sp;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const a = .15 + .15 * Math.sin(p.ph);
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        x.fillStyle = `rgba(245,158,11,${a})`; x.fill();
      });
      animationFrameId = requestAnimationFrame(frame);
    };
    frame();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const role = currentUser?.role || 'CUSTOMER';
  const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : 'GU';

  // Navigation config based on role
  const navItems = [];
  if (role !== 'CUSTOMER') {
    navItems.push({ path: '/', label: 'Command Centre', icon: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, roles: ['ALL'] });
  }

  if (role === 'ADMIN' || role === 'CUSTOMER_SERVICE_OFFICER') {
    navItems.push({ path: '/users', label: 'Users & Staff', icon: <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>, roles: ['ALL'] });
  }

  if (role === 'ADMIN' || role === 'CUSTOMER_SERVICE_OFFICER' || role === 'WORKSHOP_OPERATIONS_MANAGER' || role === 'SCHEDULING_OFFICER' || role === 'CUSTOMER') {
    navItems.push({ path: '/vehicles', label: role === 'CUSTOMER' ? 'My Fleet' : 'Vehicles', icon: <svg viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h10l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>, roles: ['ALL'] });
  }

  if (role === 'ADMIN' || role === 'CUSTOMER_SERVICE_OFFICER' || role === 'WORKSHOP_OPERATIONS_MANAGER' || role === 'SCHEDULING_OFFICER' || role === 'FINANCE_OFFICER' || role === 'CUSTOMER') {
    navItems.push({ path: '/booking', label: 'Service Log', icon: <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>, roles: ['ALL'] });
  }

  if (role === 'ADMIN' || role === 'SCHEDULING_OFFICER') {
    navItems.push({ path: '/scheduling', label: 'Scheduling', icon: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, roles: ['ALL'] });
  }

  if (role === 'ADMIN' || role === 'FINANCE_OFFICER' || role === 'CUSTOMER') {
    navItems.push({ path: '/payment', label: 'Payments', icon: <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, roles: ['ALL'] });
  }

  if (role === 'ADMIN' || role === 'FUEL_STATION_MANAGER' || role === 'CUSTOMER') {
    navItems.push({ path: '/fuel', label: 'Fuel Operations', icon: <svg viewBox="0 0 24 24"><path d="M3 3h18v18H3zM9 9h6v6H9z"/></svg>, roles: ['ALL'] });
  }

  if (role === 'ADMIN' || role === 'CUSTOMER_SERVICE_OFFICER') {
    navItems.push({ path: '/notifications', label: 'System Audit', icon: <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>, roles: ['STAFF'] });
  } else if (role === 'CUSTOMER') {
    navItems.push({ path: '/notifications', label: 'Notifications', icon: <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>, roles: ['CUSTOMER'] });
  }

  const currentNav = navItems.find(n => n.path === location.pathname) || navItems[0];

  return (
    <>
      <CursorGlow />
      <canvas id="cv-particles" ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}></canvas>
      <div className="bg"></div><div className="bg-overlay"></div><div className="grid-bg"></div>

      <div className="app">
        {/* SIDEBAR */}
        <div className="sb">
          <div className="sb-top">
            <div className="sb-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <img src="/AutoFlow_LOGO.jpg" alt="AutoFlow Logo" style={{ height: '40px', objectFit: 'contain' }} />
            </div>
          </div>
          
          <div className="sb-user" onClick={() => setIsProfileModalVisible(true)} style={{ cursor: 'pointer', transition: 'background 0.2s', padding: '12px', borderRadius: '8px', border: '1px solid transparent' }} onMouseEnter={e => {e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor='rgba(245,158,11,0.2)'}} onMouseLeave={e => {e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='transparent'}}>
            <div className="av">{getInitials(currentUser?.fullName)}</div>
            <div style={{ flex: 1 }}>
              <div className="sb-uname" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {currentUser?.fullName || 'Guest User'}
                <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, stroke: 'var(--amber)', fill: 'none', strokeWidth: 2, opacity: 0.7 }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <div className="sb-urole">{role}</div>
            </div>
          </div>

          <nav className="sb-nav">
            <div className="nb-sec">Main</div>
            {navItems.map(item => (
              <div 
                key={item.path}
                className={`ni ${location.pathname === item.path ? 'on' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </nav>

          <div className="sb-foot">
            <button className="logout-btn" onClick={handleLogout} style={{ width: '100%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', fontFamily: "'DM Mono', monospace", cursor: 'pointer', padding: '16px', opacity: 0.8, transition: 'opacity 0.2s' }}>
              <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              SIGN OUT
            </button>
          </div>
        </div>

        {/* MAIN AREA */}
        <div className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>
          {/* TOPBAR */}
          <div className="topbar" style={{ height: 'var(--th)', borderBottom: '1px solid var(--border)', background: 'rgba(26,17,37,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span className="tb-eyebrow" style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '2px', color: 'var(--blue)', textTransform: 'uppercase' }}>OVERVIEW</span>
              <span className="tb-title" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '18px', fontWeight: 700, color: '#fff' }}>{currentNav.label}</span>
            </div>
            <div className="tb-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="tb-status" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--green)', letterSpacing: '1px' }}>
                <div className="tb-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }}></div>
                ONLINE
              </div>
            </div>
          </div>
          
          {/* CONTENT OUTLET */}
          <div style={{ flex: 1, padding: '24px', overflow: 'visible' }}>
            <Outlet />
          </div>
        </div>
      </div>

      {/* PROFILE SETTINGS MODAL */}
      {isProfileModalVisible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 5, 20, 0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '400px', padding: '24px', background: 'var(--bg)', border: '1px solid var(--amber)', boxShadow: '0 0 30px rgba(245,158,11,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '20px', fontWeight: 700, color: '#fff' }}>Profile Settings</div>
              <button onClick={() => setIsProfileModalVisible(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            
            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px', fontFamily: "'DM Mono', monospace" }}>Email (Read Only)</label>
                <input type="email" value={currentUser?.email || ''} readOnly style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-soft)', borderRadius: '8px', color: 'var(--muted)', fontSize: '15px', outline: 'none' }} />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px', fontFamily: "'DM Mono', monospace" }}>Full Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none' }} />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px', fontFamily: "'DM Mono', monospace" }}>Mobile Number</label>
                <input type="text" value={editMobile} onChange={e => setEditMobile(e.target.value)} required style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '15px', outline: 'none' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-go" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MainLayout;
