import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Select, InputNumber, Input, message } from 'antd';
import { paymentService } from '../../services/paymentService';

const { Option } = Select;

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchBookingId, setSearchBookingId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser(u);
      if (u.role === 'CUSTOMER') {
        fetchMyPayments();
      }
    }
  }, []);

  const fetchMyPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getMyPayments();
      setPayments(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async (bookingId) => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const data = await paymentService.getPaymentsByBooking(bookingId);
      setPayments(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async (values) => {
    try {
      const paymentData = {
        booking: { bookingId: values.bookingId },
        method: values.method,
        amount: values.amount,
        providerRef: values.providerRef
      };
      await paymentService.initiatePayment(paymentData);
      message.success('Payment initiated successfully');
      setIsModalVisible(false);
      form.resetFields();
      if (searchBookingId == values.bookingId) {
        fetchPayments(searchBookingId);
      }
    } catch (error) {
      message.error('Failed to initiate payment');
    }
  };

  const handleVerify = async (paymentId) => {
    try {
      await paymentService.verifyPayment(paymentId);
      message.success(`Payment verified and Invoice generated!`);
      if (searchBookingId) fetchPayments(searchBookingId);
    } catch (error) {
      message.error('Failed to verify payment');
    }
  };

  const handleDelete = async (id) => {
    try {
      await paymentService.deletePayment(id);
      message.success('Payment deleted');
      if (searchBookingId) fetchPayments(searchBookingId);
    } catch (error) {
      message.error('Failed to delete payment');
    }
  };

  return (
    <div className="panel on">
      <div className="sh">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="sh-eye">Financials</div>
            <h1>Payments</h1>
            <div className="sh-sub">Initiate and track service payments.</div>
          </div>
          <button className="btn-go" onClick={() => setIsModalVisible(true)}>+ Pay Now</button>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        {currentUser && currentUser.role !== 'CUSTOMER' && (
          <div className="ch" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
            <input 
              type="number" 
              placeholder="Enter Booking ID to view payments..." 
              style={{ width: '300px', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)', borderRadius: '8px', color: '#fff', outline: 'none' }}
              value={searchBookingId}
              onChange={(e) => setSearchBookingId(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchPayments(searchBookingId) }}
            />
            <button className="btn-go" onClick={() => fetchPayments(searchBookingId)}>Search</button>
          </div>
        )}

        {payments.length > 0 ? (
          <div className="tl">
            {payments.map((p) => (
              <div className="tl-item" key={p.paymentId}>
                <div className="tl-dot td-bl">💳</div>
                <div className="tl-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="tl-title" style={{ fontSize: '16px' }}>Rs. {p.amount.toFixed(2)} via {p.method}</div>
                    <div className="tl-meta" style={{ marginTop: '6px' }}>
                      <span className={`badge ${p.status === 'COMPLETED' ? 'b-gr' : p.status === 'FAILED' ? 'b-er' : 'b-am'}`}>{p.status}</span>
                      <span style={{ marginLeft: '12px' }}>Payment ID: {p.paymentId}</span>
                      <span style={{ marginLeft: '12px' }}>â€¢ Ref: {p.providerRef || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {/* Staff Verification Button */}
                  {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'FINANCE_OFFICER' || currentUser.role === 'CUSTOMER_SERVICE_OFFICER') && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {p.status === 'PENDING' && <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'var(--green)', color: '#000' }} onClick={() => handleVerify(p.paymentId)}>Verify</button>}
                      <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }} onClick={() => handleDelete(p.paymentId)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ padding: '40px' }}>
            <div className="empty-ic" style={{ fontSize: '32px' }}>ðŸ’°</div>
            <div className="empty-tx">{searchBookingId ? 'No payments found for this Booking ID' : 'Search a Booking ID to view payments'}</div>
          </div>
        )}
      </div>

      <Modal title={<span style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '20px' }}>Initiate Payment</span>} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null} className="custom-modal">
        <Form form={form} layout="vertical" onFinish={handleInitiatePayment}>
          <Form.Item name="bookingId" label="Booking ID" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
          <Form.Item name="amount" label="Amount (Rs.)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0.01} step={0.01} /></Form.Item>
          <Form.Item name="method" label="Payment Method" rules={[{ required: true }]}>
            <Select>
              <Option value="CASH">Cash</Option>
              <Option value="CARD">Card</Option>
              <Option value="BANK_TRANSFER">Bank Transfer</Option>
            </Select>
          </Form.Item>
          {currentUser && currentUser.role !== 'CUSTOMER' && (
            <Form.Item name="providerRef" label="Provider Reference / Cheque No"><Input /></Form.Item>
          )}
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn-go" style={{ flex: 1 }}>Submit Payment</button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Payments;
