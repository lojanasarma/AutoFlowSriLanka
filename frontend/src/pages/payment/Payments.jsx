import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Form, Select, InputNumber, Input, message } from 'antd';
import { paymentService } from '../../services/paymentService';

const { Option } = Select;

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRefundModalVisible, setIsRefundModalVisible] = useState(false);
  const [refundPayment, setRefundPayment] = useState(null);
  const [refundableBalances, setRefundableBalances] = useState({});
  const [invoice, setInvoice] = useState(null);
  const [isInvoiceVisible, setIsInvoiceVisible] = useState(false);
  const [searchBookingId, setSearchBookingId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  const [refundForm] = Form.useForm();
  const paymentRequestRef = useRef(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser(u);
      if (u.role === 'CUSTOMER') {
        fetchMyPayments();
      } else if (u.role === 'ADMIN' || u.role === 'FINANCE_OFFICER') {
        fetchAllPayments();
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
    setSubmittingPayment(true);
    try {
      const paymentData = {
        booking: { bookingId: values.bookingId },
        method: values.method,
        amount: values.amount,
        demoCardOutcome: values.method === 'CARD' ? values.demoCardOutcome : undefined,
        providerRef: values.providerRef?.trim() || (paymentRequestRef.current ||= crypto.randomUUID())
      };
      const savedPayment = await paymentService.initiatePayment(paymentData);
      paymentRequestRef.current = null;
      message.success(savedPayment.status === 'COMPLETED'
        ? 'Demo card payment approved; invoice generated.'
        : savedPayment.status === 'FAILED'
          ? 'Demo card payment declined. No invoice was generated.'
          : 'Payment recorded and awaiting finance verification.');
      setIsModalVisible(false);
      form.resetFields();
      if (searchBookingId == values.bookingId) {
        fetchPayments(searchBookingId);
      } else if (currentUser?.role === 'CUSTOMER') {
        fetchMyPayments();
      }
    } catch (error) {
      message.error(error.response?.data || (error.response?.status === 400 ? 'Payment was rejected. Check the amount, method, and reference.' : 'Failed to initiate payment'));
    } finally {
      setSubmittingPayment(false);
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

  const fetchAllPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getAllPayments();
      setPayments(data || []);
      setSearchBookingId('');
    } catch (error) {
      message.error('Failed to load all transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (paymentId) => {
    try {
      const data = await paymentService.getInvoiceByPayment(paymentId);
      setInvoice(data);
      setIsInvoiceVisible(true);
    } catch (error) {
      message.info('No invoice is available for this payment yet.');
    }
  };

  useEffect(() => {
    if (!['ADMIN', 'FINANCE_OFFICER'].includes(currentUser?.role) || payments.length === 0) {
      setRefundableBalances({});
      return;
    }
    let active = true;
    Promise.all(payments.map(async (payment) => {
      if (payment.status !== 'COMPLETED') return [payment.paymentId, 0];
      try {
        return [payment.paymentId, Number(await paymentService.getRefundableAmount(payment.paymentId))];
      } catch {
        return [payment.paymentId, null];
      }
    })).then(entries => { if (active) setRefundableBalances(Object.fromEntries(entries)); });
    return () => { active = false; };
  }, [currentUser, payments]);

  const handleRefund = async (values) => {
    try {
      await paymentService.requestRefund({
        paymentId: refundPayment.paymentId,
        amount: values.amount,
        reason: values.reason
      });
      message.success('Refund processed successfully');
      setIsRefundModalVisible(false);
      refundForm.resetFields();
      if (searchBookingId) fetchPayments(searchBookingId);
    } catch (error) {
      const response = error.response?.data;
      message.error(typeof response === 'string' ? response
        : response?.message || 'Refund could not be processed. Check the payment and refundable balance.');
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
              <button className="btn-go" onClick={fetchAllPayments}>All transactions</button>
          </div>
        )}

        {payments.length > 0 ? (
          <div className="tl">
            {payments.map((p) => (
              <div className="tl-item" key={p.paymentId}>
                <div className="tl-dot td-bl">💳</div>
                <div className="tl-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                  <div className="tl-title" style={{ fontSize: '16px' }}>Rs. {Number(p.amount).toFixed(2)} via {p.method}</div>
                    <div className="tl-meta" style={{ marginTop: '6px' }}>
                      <span className={`badge ${p.status === 'COMPLETED' ? 'b-gr' : p.status === 'FAILED' ? 'b-er' : 'b-am'}`}>{p.status}</span>
                      <span style={{ marginLeft: '12px' }}>Payment ID: {p.paymentId}</span>
                      {p.booking?.bookingId && <span style={{ marginLeft: '12px' }}>Booking: {p.booking.bookingRef || p.booking.ref || p.booking.bookingId}</span>}
                      {currentUser?.role !== 'CUSTOMER' && p.booking?.customer?.fullName && <span style={{ marginLeft: '12px' }}>Customer: {p.booking.customer.fullName}</span>}
                      <span style={{ marginLeft: '12px' }}>â€¢ Ref: {p.providerRef || 'N/A'}</span>
                    </div>
                    {currentUser?.role === 'FINANCE_OFFICER' && p.status === 'COMPLETED'
                      && refundableBalances[p.paymentId] != null && (
                        <div className="tl-meta" style={{ marginTop: 6 }}>
                          Refundable balance: Rs. {Number(refundableBalances[p.paymentId]).toFixed(2)}
                        </div>
                    )}
                  </div>
                  
                  {/* Staff Verification Button */}
                  {currentUser?.role === 'CUSTOMER' && p.status === 'COMPLETED' && (
                    <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0 }} onClick={() => handleViewInvoice(p.paymentId)}>View Invoice</button>
                  )}
                  {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'FINANCE_OFFICER') && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {p.status === 'PENDING' && <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'var(--green)', color: '#000' }} onClick={() => handleVerify(p.paymentId)}>Verify</button>}
                      {currentUser.role === 'FINANCE_OFFICER' && p.status === 'COMPLETED' && <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0 }} onClick={async () => {
                        try {
                          const refundable = Number(await paymentService.getRefundableAmount(p.paymentId));
                          if (refundable <= 0) { message.info('This payment has no refundable balance.'); return; }
                          setRefundPayment({ ...p, refundableAmount: refundable });
                          refundForm.setFieldsValue({ amount: refundable, reason: '' });
                          setIsRefundModalVisible(true);
                        } catch (error) { message.error('Could not load the remaining refundable balance.'); }
                      }}>Refund</button>}
                      {currentUser.role === 'ADMIN' && <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }} onClick={() => handleDelete(p.paymentId)}>Delete</button>}
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
          <div style={{ marginBottom: 16, color: 'var(--muted)', fontSize: 12 }}>
            Demo payment only. Card approval/decline is simulated; no card details are collected and no real charge is made.
          </div>
          <Form.Item name="bookingId" label="Booking ID" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
          <Form.Item name="amount" label="Amount (Rs.)" rules={[{ required: true, message: 'Enter a payment amount' }, { type: 'number', min: 0.01, message: 'Payment amount must be greater than zero' }]}><InputNumber style={{ width: '100%' }} min={0.01} step={0.01} /></Form.Item>
          <Form.Item name="method" label="Payment Method" rules={[{ required: true, message: 'Select a supported payment method' }]}>
            <Select>
              <Option value="CASH">Cash</Option>
              <Option value="CARD">Card</Option>
              <Option value="BANK_TRANSFER">Bank Transfer</Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(previous, current) => previous.method !== current.method}>
            {({ getFieldValue }) => getFieldValue('method') === 'CARD' && (
              <Form.Item name="demoCardOutcome" label="Demo card result" initialValue="APPROVED" rules={[{ required: true }]}>
                <Select>
                  <Option value="APPROVED">Approved</Option>
                  <Option value="DECLINED">Declined</Option>
                </Select>
              </Form.Item>
            )}
          </Form.Item>
          {currentUser && currentUser.role !== 'CUSTOMER' && (
            <Form.Item name="providerRef" label="Provider Reference / Cheque No"><Input /></Form.Item>
          )}
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn-go" style={{ flex: 1 }} disabled={submittingPayment}>{submittingPayment ? 'Submitting…' : 'Submit Payment'}</button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      <Modal title={<span style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '20px' }}>Payment Invoice</span>} open={isInvoiceVisible} onCancel={() => setIsInvoiceVisible(false)} footer={null} className="custom-modal">
        {invoice && (
          <div style={{ color: '#fff', lineHeight: 2 }}>
            <div>Invoice: #{invoice.invoiceId}</div>
            <div>Payment: #{invoice.payment?.paymentId ?? '—'}</div>
            <div>Amount: Rs. {Number(invoice.amount || 0).toFixed(2)}</div>
            <div>Issued: {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleString() : '—'}</div>
            <div>Status: {invoice.status}</div>
          </div>
        )}
      </Modal>
      <Modal title={<span style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '20px' }}>Process Refund</span>} open={isRefundModalVisible} onCancel={() => setIsRefundModalVisible(false)} footer={null} className="custom-modal">
        <Form form={refundForm} layout="vertical" onFinish={handleRefund}>
          <Form.Item label="Payment ID"><Input value={refundPayment?.paymentId} readOnly /></Form.Item>
          <Form.Item name="amount" label={`Refund Amount (Rs.) — remaining Rs. ${Number(refundPayment?.refundableAmount || 0).toFixed(2)}`} rules={[{ required: true }, { type: 'number', min: 0.01, message: 'Enter an amount greater than zero' }]}><InputNumber style={{ width: '100%' }} min={0.01} max={Number(refundPayment?.refundableAmount || 0)} step={0.01} /></Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, whitespace: true, message: 'Enter a refund reason' }]}><Input.TextArea rows={3} maxLength={500} /></Form.Item>
          <button type="submit" className="btn-go" style={{ width: '100%' }}>Confirm Refund</button>
        </Form>
      </Modal>
    </div>
  );
};

export default Payments;
