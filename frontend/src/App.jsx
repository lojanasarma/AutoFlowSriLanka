import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { ConfigProvider, theme } from 'antd';
import './App.css';

import Users from './pages/user/Users';
import Vehicles from './pages/vehicle/Vehicles';
import Fuel from './pages/fuel/Fuel';
import Bookings from './pages/booking/Bookings';
import Payments from './pages/payment/Payments';
import Notifications from './pages/notification/Notifications';
import Dashboard from './pages/Dashboard';
import LandingAuth from './pages/auth/LandingAuth';

import Scheduling from './pages/booking/Scheduling';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RoleRoute = ({ allowedRoles, children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  return allowedRoles.includes(user.role) ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#F59E0B',
          colorInfo: '#F59E0B',
          colorSuccess: '#6EE7B7',
          colorWarning: '#FBBF24',
          colorError: '#F87171',
          colorBgBase: '#1A1125',
          colorBgContainer: '#251933', // Solid fallback for cards/surfaces
          colorBgElevated: '#1E142B',
          colorTextBase: '#FFFFFF',
          colorTextSecondary: 'rgba(255,255,255,0.65)',
          colorBorder: 'rgba(255,255,255,0.07)',
          fontFamily: `'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
          borderRadius: 8,
          controlHeight: 42,
        },
        components: {
          Layout: {
            bodyBg: '#1A1125',
            headerBg: 'rgba(26, 17, 37, 0.95)',
            siderBg: 'rgba(26, 17, 37, 0.95)',
          },
          Card: {
            colorBgContainer: 'rgba(255,255,255,0.04)',
            colorBorderSecondary: 'rgba(245,158,11,0.16)',
            borderRadiusLG: 12,
            paddingLG: 20,
          },
          Table: {
            colorBgContainer: 'rgba(255,255,255,0.02)',
            headerBg: 'rgba(245,158,11,0.05)',
            borderColor: 'rgba(255,255,255,0.05)',
            headerColor: '#FFFFFF',
            headerBorderRadius: 8,
          },
          Button: {
            borderRadius: 8,
            fontWeight: 700,
            primaryShadow: 'none',
          },
          Input: {
            colorBgContainer: 'rgba(255,255,255,0.045)',
            colorBorder: 'rgba(255,255,255,0.07)',
            activeBorderColor: 'rgba(245,158,11,0.55)',
            hoverBorderColor: 'rgba(245,158,11,0.3)',
            activeShadow: '0 0 0 3px rgba(245,158,11,0.08)',
          },
          Select: {
            colorBgContainer: 'rgba(255,255,255,0.045)',
            colorBorder: 'rgba(255,255,255,0.07)',
          },
          Modal: {
            colorBgElevated: '#1E142B',
            borderRadiusLG: 14,
          },
          Menu: {
            itemBg: 'transparent',
            itemColor: 'rgba(255,255,255,0.65)',
            itemHoverColor: '#FFFFFF',
            itemHoverBg: 'rgba(255,255,255,0.04)',
            itemSelectedColor: '#F59E0B',
            itemSelectedBg: 'rgba(245,158,11,0.10)',
            itemActiveBg: 'rgba(245,158,11,0.10)',
          }
        }
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<LandingAuth />} />
          <Route path="/register" element={<LandingAuth />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<RoleRoute allowedRoles={['ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'SCHEDULING_OFFICER', 'WORKSHOP_OPERATIONS_MANAGER', 'FINANCE_OFFICER', 'FUEL_STATION_MANAGER']}><Dashboard /></RoleRoute>} />
            <Route path="users/*" element={<RoleRoute allowedRoles={['ADMIN', 'CUSTOMER_SERVICE_OFFICER']}><Users /></RoleRoute>} />
            <Route path="vehicles/*" element={<RoleRoute allowedRoles={['ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'WORKSHOP_OPERATIONS_MANAGER', 'SCHEDULING_OFFICER', 'CUSTOMER']}><Vehicles /></RoleRoute>} />
            <Route path="fuel/*" element={<RoleRoute allowedRoles={['ADMIN', 'FUEL_STATION_MANAGER', 'CUSTOMER']}><Fuel /></RoleRoute>} />
            <Route path="booking/*" element={<RoleRoute allowedRoles={['ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'SCHEDULING_OFFICER', 'WORKSHOP_OPERATIONS_MANAGER', 'FINANCE_OFFICER', 'CUSTOMER']}><Bookings /></RoleRoute>} />
            <Route path="scheduling/*" element={<RoleRoute allowedRoles={['ADMIN', 'SCHEDULING_OFFICER']}><Scheduling /></RoleRoute>} />
            <Route path="payment/*" element={<RoleRoute allowedRoles={['ADMIN', 'FINANCE_OFFICER', 'CUSTOMER']}><Payments /></RoleRoute>} />
            <Route path="notifications/*" element={<RoleRoute allowedRoles={['ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'CUSTOMER']}><Notifications /></RoleRoute>} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
