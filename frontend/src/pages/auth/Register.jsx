import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Radio, Select } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined, PhoneOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../../services/authService';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState('CUSTOMER');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    let finalRole = 'CUSTOMER';

    if (accountType === 'ADMIN') {
      const code = window.prompt("Enter Admin Access Code:");
      if (code !== 'SE2030') {
        message.error("Invalid Admin Access Code.");
        return;
      }
      finalRole = 'ADMIN';
    } else if (accountType === 'STAFF') {
      const code = window.prompt("Enter Staff Access Code:");
      if (code !== 'SE2030_SL') {
        message.error("Invalid Staff Access Code.");
        return;
      }
      finalRole = values.staffRole;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email,
        mobile: values.mobile,
        passwordHash: values.password,
        role: finalRole
      };

      const response = await authService.register(payload);
      const { user, token } = response;
      message.success(`Registration successful! Welcome, ${user.fullName}!`);
      // Auto login after registration
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      navigate('/');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        message.error(error.response.data);
      } else {
        message.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 480 }}
      >
        <Card className="glass-card" bordered={false} style={{ padding: '20px 10px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src="/AutoFlow_LOGO.jpg" alt="AutoFlow Logo" style={{ height: '70px', objectFit: 'contain', marginBottom: '16px', borderRadius: '8px' }} />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>JOIN AUTOFLOW PLATFORM</Text>
          </div>

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item 
              name="fullName" 
              rules={[{ required: true, message: 'Please input your full name!' }]}
            >
              <Input prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />} placeholder="Full Name" />
            </Form.Item>

            <Form.Item 
              name="email" 
              rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Valid email required' }]}
            >
              <Input prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />} placeholder="Email address" />
            </Form.Item>

            <Form.Item 
              name="mobile" 
              rules={[{ required: true, message: 'Please input your mobile number!' }]}
            >
              <Input prefix={<PhoneOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />} placeholder="Mobile Number" />
            </Form.Item>

            <Form.Item 
              name="password" 
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />} placeholder="Password" />
            </Form.Item>

            <div style={{ marginBottom: 24, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 12, fontWeight: 600, fontFamily: 'Rajdhani, sans-serif' }}>Account Type</Text>
              <Radio.Group 
                value={accountType} 
                onChange={(e) => setAccountType(e.target.value)} 
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <Radio value="CUSTOMER" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Rajdhani, sans-serif' }}>Standard Customer</Radio>
                <Radio value="STAFF" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Rajdhani, sans-serif' }}>
                  <Space><TeamOutlined style={{ color: '#4FC3F7' }} /> Staff Member</Space>
                </Radio>
                <Radio value="ADMIN" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Rajdhani, sans-serif' }}>
                  <Space><SafetyCertificateOutlined style={{ color: '#F87171' }} /> System Administrator</Space>
                </Radio>
              </Radio.Group>

              {accountType === 'STAFF' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 16 }}>
                  <Form.Item 
                    name="staffRole" 
                    rules={[{ required: true, message: 'Please select a staff role!' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select placeholder="Select Staff Role" style={{ width: '100%' }}>
                      <Option value="FUEL_STATION_MANAGER">Fuel Station Manager</Option>
                      <Option value="WORKSHOP_OPERATIONS_MANAGER">Workshop Operational Manager</Option>
                      <Option value="FINANCE_OFFICER">Finance Officer</Option>
                      <Option value="SCHEDULING_OFFICER">Scheduling Officer</Option>
                      <Option value="CUSTOMER_SERVICE_OFFICER">Customer Service Officer</Option>
                      <Option value="SERVICE_CENTER">Service Center</Option>
                    </Select>
                  </Form.Item>
                  <div style={{ fontSize: 10, color: '#4FC3F7', marginTop: 8, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px' }}>Requires Authorization Code ('SE2030_SL') upon submission.</div>
                </motion.div>
              )}
              {accountType === 'ADMIN' && (
                <div style={{ fontSize: 10, color: '#F87171', marginTop: 12, marginLeft: 24, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px' }}>Requires Admin Authorization Code ('SE2030') upon submission.</div>
              )}
            </div>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                SIGN UP
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>Already have an account? </Text>
            <Link to="/login" style={{ color: '#4FC3F7', fontWeight: 600, fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.5px' }}>SIGN IN HERE</Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
