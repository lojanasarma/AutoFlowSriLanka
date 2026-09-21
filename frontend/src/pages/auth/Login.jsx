import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../../services/authService';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await authService.login(values);
      const { user, token } = response;
      message.success(`Welcome back, ${user.fullName}!`);
      // Store user and token in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      // Redirect to dashboard
      navigate('/');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        message.error('Invalid email or password');
      } else {
        message.error('Login failed. Please try again.');
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
        style={{ width: '100%', maxWidth: 400 }}
      >
        <Card className="glass-card" bordered={false} style={{ padding: '20px 10px' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <img src="/AutoFlow_LOGO.jpg" alt="AutoFlow Logo" style={{ height: '70px', objectFit: 'contain', marginBottom: '16px', borderRadius: '8px' }} />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>ENTER YOUR CREDENTIALS TO CONTINUE</Text>
          </div>

          <Form layout="vertical" onFinish={onFinish} size="large">
            <Form.Item 
              name="email" 
              rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Valid email required' }]}
            >
              <Input prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />} placeholder="Email address" />
            </Form.Item>

            <Form.Item 
              name="password" 
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />} placeholder="Password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ marginTop: 10 }}>
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>Don't have an account? </Text>
            <Link to="/register" style={{ color: '#4FC3F7', fontWeight: 600, fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.5px' }}>CREATE AN ACCOUNT</Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
