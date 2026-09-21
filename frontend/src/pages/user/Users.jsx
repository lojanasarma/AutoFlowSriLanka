import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, Select, message } from 'antd';
import { userService } from '../../services/userService';

const { Option } = Select;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  const isAdmin = currentUser?.role === 'ADMIN';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchUsers();
  }, []);

  const handleAddUser = async (values) => {
    try {
      await userService.createUser(values);
      message.success('User created successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error('Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await userService.deleteUser(userId);
      message.success('User deleted');
      fetchUsers();
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleAcceptUser = async (userId) => {
    try {
      const userToUpdate = users.find(u => u.userId === userId);
      if (userToUpdate) {
        await userService.updateUser(userId, { ...userToUpdate, status: 'ACTIVE' });
        message.success('Staff role accepted and provisioned');
        fetchUsers();
      }
    } catch (error) {
      message.error('Failed to accept user');
    }
  };

  return (
    <div className="panel on">
      <div className="sh">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="sh-eye">System Administration</div>
            <h1>User Management</h1>
            <div className="sh-sub">Manage global users, staff roles, and access controls.</div>
          </div>
          {isAdmin && (
            <button className="btn-go" onClick={() => setIsModalVisible(true)}>+ Provision User</button>
          )}
        </div>
      </div>

      <div className="car-grid">
        {users.map(u => (
          <div className="car-card" key={u.userId}>
            <div className="cc-top">
              <span className="cc-plate">{u.role}</span>
              {u.status !== 'PENDING' ? (
                <span className={`badge ${u.status === 'ACTIVE' ? 'b-gr' : 'b-er'}`}>{u.status}</span>
              ) : (
                <span className="badge b-am">PENDING ACCEPTANCE</span>
              )}
            </div>
            <div className="cc-name" style={{ fontSize: '18px', marginTop: '12px' }}>{u.fullName}</div>
            <div className="cc-meta" style={{ marginTop: '8px' }}>{u.email}</div>
            <div className="cc-meta">{u.mobile}</div>
            
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {u.status === 'PENDING' && (
                    <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'var(--green)', color: '#000' }} onClick={() => handleAcceptUser(u.userId)}>Accept Role</button>
                  )}
                  {u.role !== 'ADMIN' && (
                    <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }} onClick={() => handleDeleteUser(u.userId)}>Delete</button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div className="empty" style={{ padding: '40px' }}>
          <div className="empty-tx" style={{ fontSize: '14px' }}>No users found</div>
        </div>
      )}

      <Modal title={<span style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '20px' }}>Provision New User</span>} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null} className="custom-modal">
        <Form form={form} layout="vertical" onFinish={handleAddUser}>
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}><Input /></Form.Item>
          <Form.Item name="mobile" label="Mobile" rules={[{ required: true }, { pattern: /^\+?[0-9]{9,15}$/, message: 'Enter a valid mobile number' }]}><Input /></Form.Item>
          <Form.Item name="passwordHash" label="Password" rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}><Input.Password /></Form.Item>
          <Form.Item name="role" label="Role" initialValue="CUSTOMER">
            <Select>
              <Option value="CUSTOMER">Customer</Option>
              <Option value="ADMIN">Admin</Option>
              <Option value="CUSTOMER_SERVICE_OFFICER">CSO</Option>
              <Option value="FINANCE_OFFICER">Finance</Option>
              <Option value="WORKSHOP_OPERATIONS_MANAGER">Workshop Ops</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="ACTIVE">
            <Select>
              <Option value="ACTIVE">Active</Option>
              <Option value="INACTIVE">Inactive</Option>
              <Option value="SUSPENDED">Suspended</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn-go" style={{ flex: 1 }}>Submit</button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;


