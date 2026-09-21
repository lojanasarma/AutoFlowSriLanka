import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { authService } from '../../services/authService';
import CursorGlow from '../../components/CursorGlow';
import { motion } from 'framer-motion';
import './LandingAuth.css';

const LandingAuth = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('CUSTOMER');
  const [adminSecret, setAdminSecret] = useState('');
  
  // Registration Steps
  const [step, setStep] = useState(1);

  const canvasRef = useRef(null);

  useEffect(() => {
    // Particle animation logic from friend's code
    const c = canvasRef.current;
    if (!c) return;
    const x = c.getContext('2d');
    let W, H;
    const pts = [];
    
    const resize = () => { W = c.width = window.innerWidth; H = c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    
    for (let i = 0; i < 68; i++) {
      pts.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - .5) * .38,
        vy: (Math.random() - .5) * .38,
        r: Math.random() * 1.8 + .8,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * .025 + .012
      });
    }

    let animationFrameId;
    const frame = () => {
      x.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.ph += p.sp;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const a = .35 + .28 * Math.sin(p.ph);
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        x.fillStyle = `rgba(245,158,11,${a})`; x.fill();
        x.beginPath(); x.arc(p.x, p.y, p.r + 2.5, 0, Math.PI * 2);
        x.fillStyle = `rgba(245,158,11,${a * .2})`; x.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 125) {
            const a = .45 * (1 - d / 125);
            x.beginPath(); x.moveTo(pts[i].x, pts[i].y); x.lineTo(pts[j].x, pts[j].y);
            x.strokeStyle = `rgba(245,158,11,${a})`; x.lineWidth = .7; x.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(frame);
    };
    frame();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleEmailChange = (e, setter) => {
    let val = e.target.value;
    if (val.endsWith('@') && val.indexOf('@') === val.length - 1) {
      val = val + 'gmail.com';
    }
    setter(val);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.login({ email: loginEmail, password: loginPassword });
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);
      message.success(`Welcome back, ${response.user.fullName}!`);
      navigate('/');
    } catch (error) {
      message.error('Invalid email or password');
      setLoading(false);
    } 
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const response = await authService.register({
        fullName: regFullName,
        email: regEmail,
        mobile: regMobile, 
        passwordHash: regPassword, 
        role: regRole,
        adminAccessCode: regRole === 'ADMIN' ? adminSecret : undefined
      });
      
      if (response.user && response.user.status === 'PENDING') {
        message.success('Registration successful. Please wait for an administrator to approve your account.');
        setLoading(false);
        setActiveTab(0); // Switch to login tab
        return;
      }
      
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);
      message.success(`Welcome, ${response.user.fullName}!`);
      navigate('/');
    } catch (error) {
      message.error(error.response?.data || 'Registration failed');
      setLoading(false);
    } 
  };

  return (
    <>
      <CursorGlow />
      <canvas id="cv-particles" ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}></canvas>
      <div className="bg">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          <source src="/gemini_generated_video_82229574.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="bg-overlay"></div>
      <div className="grid-lines"></div>
      <div className="scanline"></div>

      <div className="page">
        {/* LEFT HERO */}
        <div className="hero">
          <div className="brand">
            <div className="brand-icon">🛡️</div>
            <div>
              <div className="brand-name">Auto<span>Flow</span></div>
              <div className="brand-tag">SRI LANKA PREMIER AUTO CARE</div>
            </div>
          </div>

          <div className="hero-center">
            <div className="hero-label">Premium Workshop Management</div>
            <h1 className="hero-h1">Your Vehicle,<br />Masterfully<br /><span className="accent">Serviced.</span></h1>
            <p className="hero-desc">AutoFlow Sri Lanka delivers precision auto care. Book services, track progress, and manage payments all from a single command centre.</p>
            <div className="caps">
              <div className="cap"><span className="cap-icon">🔧</span><span className="cap-text">Expert Mechanics</span></div>
              <div className="cap"><span className="cap-icon">📡</span><span className="cap-text">Live Status Tracking</span></div>
              <div className="cap"><span className="cap-icon">💳</span><span className="cap-text">Secure Payments</span></div>
              <div className="cap"><span className="cap-icon">📅</span><span className="cap-text">Easy Booking</span></div>
              <div className="cap"><span className="cap-icon">⭐</span><span className="cap-text">100% Satisfaction</span></div>
              <div className="cap"><span className="cap-icon">🏆</span><span className="cap-text">15 Yrs Experience</span></div>
            </div>
            <div className="metrics">
              <div className="metric"><span className="metric-val">5,000+</span><span className="metric-lbl">Vehicles Serviced</span></div>
              <div className="metric"><span className="metric-val">4.9/5</span><span className="metric-lbl">Customer Rating</span></div>
              <div className="metric"><span className="metric-val">24/7</span><span className="metric-lbl">Support</span></div>
            </div>
          </div>

          <div className="status-row">
            <div className="status-dot"></div>
            <span className="status-text">WORKSHOP ONLINE â€” v2.1.0</span>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="form-panel">
          <div className="auth-wrap">
            <div className="tab-bar" id="tabBar" style={{ display: 'flex' }}>
              <button type="button" className={`tab-btn ${activeTab === 0 ? 'on' : ''}`} style={{ width: '50%', marginRight: 0, textAlign: 'center' }} onClick={() => setActiveTab(0)}>SIGN IN</button>
              <button type="button" className={`tab-btn ${activeTab === 1 ? 'on' : ''}`} style={{ width: '50%', marginRight: 0, textAlign: 'center' }} onClick={() => setActiveTab(1)}>REGISTER</button>
              <div className="tab-indicator" style={{ left: activeTab === 0 ? 0 : '50%', width: '50%', transition: 'left 0.3s' }}></div>
            </div>

            {/* LOGIN PANE */}
            {activeTab === 0 && (
              <div className="pane on">
                <div className="form-section">Credentials</div>
                <form onSubmit={handleLogin}>
                  <div className="f"><label>Email Address</label><input type="email" placeholder="your_email@domain.com" required value={loginEmail} onChange={e => handleEmailChange(e, setLoginEmail)} /></div>
                  <div className="f"><label>Password</label><input type="password" placeholder="••••••" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} /></div>
                  <button type="submit" className="btn-go" style={{ marginTop: '6px' }} disabled={loading}>{loading ? 'Authenticating...' : 'INITIATE ACCESS ➔'}</button>
                </form>
                <div className="form-foot">Don't have an account? <a onClick={() => setActiveTab(1)}>Register</a></div>
              </div>
            )}

            {/* REGISTER PANE */}
            {activeTab === 1 && (
              <div className="pane on">
                <div className="form-section">Profile Setup</div>
                <form onSubmit={handleRegister}>
                  <div className="f"><label>Full Name</label><input type="text" placeholder="John Doe" required value={regFullName} onChange={e => setRegFullName(e.target.value)} /></div>
                  <div className="f"><label>Email Address</label><input type="email" placeholder="john@example.com" required value={regEmail} onChange={e => handleEmailChange(e, setRegEmail)} /></div>
                  <div className="f"><label>Mobile Number</label><input type="text" placeholder="0771234567" required value={regMobile} onChange={e => setRegMobile(e.target.value)} /></div>
                  <div className="f"><label>Password</label><input type="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required value={regPassword} onChange={e => setRegPassword(e.target.value)} /></div>
                  
                  <div className="f">
                    <label>Account Role</label>
                    <select value={regRole} onChange={e => setRegRole(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '15px' }}>
                      <option value="CUSTOMER">Customer (Default)</option>
                      <option value="ADMIN">System Admin</option>
                      <option value="CUSTOMER_SERVICE_OFFICER">Customer Service Officer</option>
                      <option value="SCHEDULING_OFFICER">Scheduling Officer</option>
                      <option value="FINANCE_OFFICER">Finance Officer</option>
                      <option value="FUEL_STATION_MANAGER">Fuel Station Manager</option>
                      <option value="WORKSHOP_OPERATIONS_MANAGER">Workshop Ops Manager</option>
                    </select>
                  </div>
                  
                  {regRole === 'ADMIN' && (
                    <div className="f">
                      <label style={{ color: 'var(--amber)' }}>Administrator Secret Code</label>
                      <input type="password" placeholder="Required for Admin Access" required value={adminSecret} onChange={e => setAdminSecret(e.target.value)} style={{ borderColor: 'var(--amber)' }} />
                    </div>
                  )}

                  {regRole !== 'CUSTOMER' && regRole !== 'ADMIN' && (
                    <div style={{ padding: '12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', color: 'var(--amber)', fontSize: '13px', marginBottom: '16px' }}>
                      <strong>Notice:</strong> Staff accounts will be created as pending. They must be approved by an Administrator before you can fully access the system.
                    </div>
                  )}

                  <div className="btn-row" style={{ marginTop: '16px' }}>
                    <button type="submit" className="btn-go" disabled={loading}>{loading ? 'Registering...' : 'Launch Account ➔'}</button>
                  </div>
                </form>
                <div className="form-foot">Already have an account? <a onClick={() => setActiveTab(0)}>Sign in</a></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingAuth;
