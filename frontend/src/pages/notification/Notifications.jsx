import React, { useState } from 'react';
import { message, Modal, Form, Select } from 'antd';
import { notificationService } from '../../services/notificationService';

const { Option } = Select;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState('');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [form] = Form.useForm();

  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser(u);
      if (u.role === 'CUSTOMER') {
        fetchNotifications(u.userId);
      }
    }
  }, []);

  const fetchNotifications = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await notificationService.getUserNotifications(userId);
      setNotifications(data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (entity) => {
    if (!entity) return;
    setLoading(true);
    try {
      const data = await notificationService.getAuditLogs(entity);
      setAuditLogs(data || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      message.success('Notification cleared');
      fetchNotifications(searchUserId || currentUser?.userId);
    } catch (error) {
      message.error('Failed to clear notification');
    }
  };

  const handleDeleteAudit = async (id) => {
    try {
      await notificationService.deleteAuditLog(id);
      message.success('Audit log cleared');
      setAuditLogs(auditLogs.filter(a => a.auditId !== id));
    } catch (error) {
      message.error('Failed to clear audit log');
    }
  };

  const handleOpenSendModal = async () => {
    setIsModalVisible(true);
    try {
      const data = await notificationService.getAllTemplates();
      setTemplates(data || []);
    } catch (e) {
      message.error("Failed to load templates");
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      message.success('Marked as read');
      fetchNotifications(searchUserId || currentUser?.userId);
    } catch (error) {
      message.error('Failed to mark as read');
    }
  };

  const handleSendBulk = async (values) => {
    try {
      await notificationService.sendBulkNotification(values.role, values.templateId, values.channel);
      message.success('Broadcast sent successfully!');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to send broadcast');
    }
  };

  return (
    <div className="panel on">
      <div className="sh">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="sh-eye">{currentUser?.role === 'ADMIN' ? 'System Audit' : 'Inbox'}</div>
            <h1>{currentUser?.role === 'ADMIN' ? 'Notifications & Logs' : 'Notifications'}</h1>
            <div className="sh-sub">{currentUser?.role === 'ADMIN' ? 'Track system events and automated alerts.' : 'View and support service notifications.'}</div>
          </div>
          {currentUser?.role === 'ADMIN' && (
            <button className="btn-go" onClick={handleOpenSendModal}>Broadcast Notification</button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div className="tab-bar" style={{ display: 'flex', marginBottom: '24px', position: 'relative', borderBottom: '1px solid var(--border-soft)' }}>
          <button type="button" className={`tab-btn ${activeTab === 0 ? 'on' : ''}`} style={{ width: '50%', marginRight: 0, textAlign: 'center', padding: '11px 0', background: 'none', border: 'none', color: activeTab === 0 ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', fontFamily: "'Orbitron', sans-serif" }} onClick={() => setActiveTab(0)}>NOTIFICATIONS</button>
          {currentUser?.role === 'ADMIN' && (
            <button type="button" className={`tab-btn ${activeTab === 1 ? 'on' : ''}`} style={{ width: '50%', marginRight: 0, textAlign: 'center', padding: '11px 0', background: 'none', border: 'none', color: activeTab === 1 ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', fontFamily: "'Orbitron', sans-serif" }} onClick={() => setActiveTab(1)}>AUDIT LOGS</button>
          )}
          <div className="tab-indicator" style={{ position: 'absolute', bottom: '-1px', height: '2px', background: 'var(--blue)', transition: 'left 0.3s, width 0.3s', boxShadow: '0 0 10px rgba(245,158,11,0.7)', left: activeTab === 0 ? 0 : '50%', width: '50%' }}></div>
        </div>

        {activeTab === 0 && (
          <div className="pane on">
            {currentUser && currentUser.role !== 'CUSTOMER' && (
              <div className="ch" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                <input 
                  type="number" 
                  placeholder="Enter User ID..." 
                  style={{ width: '300px', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchNotifications(searchUserId) }}
                />
                <button className="btn-go" onClick={() => fetchNotifications(searchUserId)}>Search</button>
              </div>
            )}

            {notifications.length > 0 ? (
              <div className="tl">
                {notifications.map((n) => (
                  <div className="tl-item" key={n.notifId}>
                    <div className="tl-dot td-bl">🔔</div>
                    <div className="tl-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className="tl-title" style={{ fontSize: '16px' }}>{n.channel} Alert</div>
                        <div className="tl-meta" style={{ marginTop: '6px' }}>
                          <span className={`badge ${n.status === 'SENT' ? 'b-gr' : 'b-am'}`}>{n.status}</span>
                          <span style={{ marginLeft: '12px' }}>Notif ID: {n.notifId}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {n.status === 'SENT' && (
                          <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'var(--green)', color: '#000' }} onClick={() => handleMarkAsRead(n.notifId)}>Mark Read</button>
                        )}
                        <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }} onClick={() => handleDeleteNotif(n.notifId)}>Clear</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty" style={{ padding: '40px' }}>
                <div className="empty-ic" style={{ fontSize: '32px' }}>🔔</div>
                <div className="empty-tx">{currentUser?.role === 'CUSTOMER' ? 'You have no new notifications' : (searchUserId ? 'No notifications found' : 'Search by User ID')}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 1 && (
          <div className="pane on">
            <div className="ch" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
              <select 
                style={{ width: '300px', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: '8px', color: '#fff', outline: 'none', appearance: 'none' }}
                onChange={(e) => { setSelectedEntity(e.target.value); fetchAuditLogs(e.target.value); }}
                value={selectedEntity}
              >
                <option value="" disabled>Select Entity to audit...</option>
                <option value="User" style={{ color: '#000' }}>User</option>
                <option value="Vehicle" style={{ color: '#000' }}>Vehicle</option>
                <option value="Booking" style={{ color: '#000' }}>Booking</option>
                <option value="Payment" style={{ color: '#000' }}>Payment</option>
                <option value="FuelLog" style={{ color: '#000' }}>FuelLog</option>
              </select>
            </div>

            {auditLogs.length > 0 ? (
              <div className="tl">
                {auditLogs.map((a) => (
                  <div className="tl-item" key={a.auditId}>
                    <div className="tl-dot td-bl">🛡️</div>
                    <div className="tl-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className="tl-title" style={{ fontSize: '16px' }}>{a.action}</div>
                        <div className="tl-meta" style={{ marginTop: '6px' }}>
                          <span style={{ color: 'var(--red)' }}>Old: {a.oldValue}</span>
                          <span style={{ margin: '0 8px' }}>➔</span>
                          <span style={{ color: 'var(--green)' }}>New: {a.newValue}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>{new Date(a.occurredAt).toLocaleString()}</div>
                      </div>
                      <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }} onClick={() => handleDeleteAudit(a.auditId)}>Clear</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty" style={{ padding: '40px' }}>
                <div className="empty-ic" style={{ fontSize: '32px' }}>🛡️</div>
                <div className="empty-tx">{selectedEntity ? `No audit logs found for ${selectedEntity}` : 'Select an entity to view audit logs'}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal title={<span style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '20px' }}>Broadcast Notification</span>} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null} className="custom-modal">
        <Form form={form} layout="vertical" onFinish={handleSendBulk}>
          <Form.Item name="role" label="Target Role" rules={[{ required: true }]}>
            <Select placeholder="Select Role">
              <Option value="CUSTOMER">Customer</Option>
              <Option value="FUEL_STATION_MANAGER">Fuel Station Manager</Option>
              <Option value="CUSTOMER_SERVICE_OFFICER">Customer Service Officer</Option>
            </Select>
          </Form.Item>
          <Form.Item name="templateId" label="Message Template" rules={[{ required: true }]}>
            <Select placeholder="Select Template">
              {templates.map(t => <Option key={t.templateId} value={t.templateId}>{t.subject}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="channel" label="Channel" rules={[{ required: true }]} initialValue="SYSTEM">
            <Select>
              <Option value="SYSTEM">System UI</Option>
              <Option value="EMAIL">Email</Option>
              <Option value="SMS">SMS</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn-go" style={{ flex: 1 }}>Send Notification</button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default Notifications;
