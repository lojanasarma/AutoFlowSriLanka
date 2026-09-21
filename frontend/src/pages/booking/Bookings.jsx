import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, message, Input } from 'antd';
import { bookingService } from '../../services/bookingService';
import { vehicleService } from '../../services/vehicleService';
import { userService } from '../../services/userService';
import { schedulingService } from '../../services/schedulingService';

const { Option } = Select;

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      if (currentUser.role === 'CUSTOMER') {
        const [bookingData, vehicleData, slotData] = await Promise.all([
          bookingService.getMyBookings(),
          vehicleService.getMyGarage(),
          schedulingService.getSlots()
        ]);
        setBookings(bookingData || []);
        setVehicles(vehicleData || []);
        setSlots(slotData || []);
      } else {
        const [bookingData, vehicleData, slotData] = await Promise.all([
          bookingService.getAllBookings(),
          vehicleService.getAllVehicles(),
          schedulingService.getSlots()
        ]);
        setBookings(bookingData || []);
        setVehicles(vehicleData || []);
        if (['ADMIN', 'CUSTOMER_SERVICE_OFFICER'].includes(currentUser.role)) {
          const userData = await userService.getAllUsers();
          setCustomers((userData || []).filter(u => u.status === 'ACTIVE' && u.role === 'CUSTOMER'));
        }
        setSlots(slotData || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleCreateBooking = async (values) => {
    try {
      const generatedRef = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const bookingData = {
        bookingRef: generatedRef,
        vehicle: { vehicleId: values.vehicleId },
        timeSlot: { slotId: values.slotId },
        serviceType: values.serviceType,
        notes: values.notes
      };
      if (currentUser.role !== 'CUSTOMER') {
        bookingData.customer = { userId: values.customerId };
      }
      await bookingService.createBooking(bookingData);
      message.success('Booking created successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('Failed to create booking');
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await bookingService.updateBookingStatus(bookingId, status);
      message.success(`Booking marked as ${status}`);
      fetchData();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await bookingService.deleteBooking(id);
      message.success('Booking deleted');
      fetchData();
    } catch (error) {
      message.error('Failed to delete booking');
    }
  };

  const canCreate = ['ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'CUSTOMER'].includes(currentUser?.role);
  const canOperate = ['ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'WORKSHOP_OPERATIONS_MANAGER', 'SCHEDULING_OFFICER'].includes(currentUser?.role);

  return (
    <div className="panel on">
      <div className="sh">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="sh-eye">Service Center</div>
            <h1>{currentUser?.role === 'CUSTOMER' ? 'My Appointments' : 'All Bookings'}</h1>
            <div className="sh-sub">Schedule and track vehicle maintenance.</div>
          </div>
          {canCreate && (
            <button className="btn-go" onClick={() => setIsModalVisible(true)}>+ New Booking</button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div className="ch" style={{ marginBottom: '24px' }}>
          <div className="ct">Service Logs</div>
        </div>

        {bookings.length > 0 ? (
          <div className="tl">
            {bookings.map((b) => (
              <div className="tl-item" key={b.bookingId}>
                <div className="tl-dot td-bl">📅</div>
                <div className="tl-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="tl-title" style={{ fontSize: '16px' }}>{b.serviceType} - {b.vehicle ? b.vehicle.regNo || b.vehicle.registrationNo : 'Unknown Vehicle'}</div>
                    <div className="tl-meta" style={{ marginTop: '6px' }}>
                      <span className={`badge ${b.status === 'COMPLETED' ? 'b-gr' : b.status === 'CANCELLED' ? 'b-er' : 'b-am'}`}>{b.status}</span>
                      <span style={{ marginLeft: '12px' }}>Ref: {b.bookingRef}</span>
                      {currentUser?.role !== 'CUSTOMER' && b.customer && <span style={{ marginLeft: '12px' }}>Customer: {b.customer.fullName}</span>}
                    </div>
                    {b.notes && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>Notes: {b.notes}</div>}
                  </div>
                  
                  {canOperate && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(b.status === 'PENDING' || b.status === 'SCHEDULED') && <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0 }} onClick={() => handleUpdateStatus(b.bookingId, 'IN_PROGRESS')}>Start</button>}
                      {b.status === 'IN_PROGRESS' && <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'var(--green)', color: '#000' }} onClick={() => handleUpdateStatus(b.bookingId, 'COMPLETED')}>Complete</button>}
                      {(b.status === 'PENDING' || b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS') && <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }} onClick={() => handleUpdateStatus(b.bookingId, 'CANCELLED')}>Cancel</button>}
                      {currentUser?.role === 'ADMIN' && (
                         <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }} onClick={() => handleDelete(b.bookingId)}>Delete</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ padding: '40px' }}>
            <div className="empty-ic" style={{ fontSize: '32px' }}>📅</div>
            <div className="empty-tx">No service appointments found</div>
          </div>
        )}
      </div>

      <Modal title={<span style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '20px' }}>Schedule Appointment</span>} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null} className="custom-modal">
        <Form form={form} layout="vertical" onFinish={handleCreateBooking}>
          {currentUser && ['ADMIN', 'CUSTOMER_SERVICE_OFFICER'].includes(currentUser.role) && (
            <Form.Item name="customerId" label="Customer" rules={[{ required: true }]}>
              <Select showSearch placeholder="Select Customer">
                {customers.map(c => <Option key={c.userId} value={c.userId}>{c.fullName}</Option>)}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="vehicleId" label="Vehicle" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select Vehicle">
              {vehicles.map(v => <Option key={v.vehicleId} value={v.vehicleId}>{v.regNo || v.registrationNo}</Option>)}
            </Select>
          </Form.Item>
          
          <Form.Item name="slotId" label="Select Time Slot" rules={[{ required: true }]}>
            <Select showSearch placeholder="Choose an available slot">
              {slots.map(s => <Option key={s.slotId} value={s.slotId}>{new Date(s.startAt).toLocaleString()} - Bay {s.bay?.bayId}</Option>)}
            </Select>
          </Form.Item>
          
          <Form.Item name="serviceType" label="Service Type" rules={[{ required: true }]}>
            <Select>
              <Option value="FULL_SERVICE">Full Service</Option>
              <Option value="OIL_CHANGE">Oil Change</Option>
              <Option value="WASH">Wash</Option>
              <Option value="REPAIR">Repair</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn-go" style={{ flex: 1 }}>Confirm Booking</button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Bookings;
