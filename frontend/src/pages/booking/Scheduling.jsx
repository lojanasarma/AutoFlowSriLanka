import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, message, Input } from 'antd';
import { schedulingService } from '../../services/schedulingService';
import dayjs from 'dayjs';

const { Option } = Select;

const Scheduling = () => {
  const [centres, setCentres] = useState([]);
  const [bays, setBays] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const centreData = await schedulingService.getAllCentres();
      setCentres(centreData || []);
      
      const bayData = await schedulingService.getBaysByCentre(1);
      setBays(bayData || []);
      
      const slotData = await schedulingService.getSlots(1);
      setSlots(slotData || []);
    } catch (error) {
      console.error("Failed to fetch scheduling data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSlot = async (values) => {
    try {
      const slotData = {
        centre: { centreId: 1 },
        bay: { bayId: values.bayId },
        startAt: values.timeRange[0].format('YYYY-MM-DDTHH:mm:ss'),
        endAt: values.timeRange[1].format('YYYY-MM-DDTHH:mm:ss'),
        status: 'AVAILABLE'
      };
      
      await schedulingService.createTimeSlot(slotData);
      message.success('Time slot generated successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('Failed to create time slot');
    }
  };

  return (
    <div className="panel on">
      <div className="sh">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="sh-eye">Operations</div>
            <h1>Master Schedule</h1>
            <div className="sh-sub">Manage service bays and time slots.</div>
          </div>
          <button className="btn-go" onClick={() => setIsModalVisible(true)}>+ Generate Slot</button>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div className="ch" style={{ marginBottom: '24px' }}>
          <div className="ct">Available Time Slots</div>
        </div>

        {slots.length > 0 ? (
          <div className="tl">
            {slots.map((s) => (
              <div className="tl-item" key={s.slotId}>
                <div className="tl-dot td-bl">⏰</div>
                <div className="tl-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="tl-title" style={{ fontSize: '16px' }}>
                      {dayjs(s.startAt).format('MMM D, YYYY h:mm A')} - {dayjs(s.endAt).format('h:mm A')}
                    </div>
                    <div className="tl-meta" style={{ marginTop: '6px' }}>
                      <span className={`badge ${s.status === 'AVAILABLE' ? 'b-gr' : 'b-am'}`}>{s.status}</span>
                      <span style={{ marginLeft: '12px' }}>Bay: {s.bay ? s.bay.name : s.bay?.bayId}</span>
                      <span style={{ marginLeft: '12px' }}>Slot ID: {s.slotId}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ padding: '40px' }}>
            <div className="empty-ic" style={{ fontSize: '32px' }}>⏰</div>
            <div className="empty-tx">No time slots found. Generate slots to allow bookings.</div>
          </div>
        )}
      </div>

      <Modal title={<span style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '20px' }}>Generate Time Slot</span>} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null} className="custom-modal">
        <Form form={form} layout="vertical" onFinish={handleCreateSlot}>
          <Form.Item name="bayId" label="Service Bay" rules={[{ required: true }]}>
            <Select placeholder="Select Bay">
              {bays.map(b => <Option key={b.bayId} value={b.bayId}>{b.name}</Option>)}
            </Select>
          </Form.Item>
          
          <Form.Item name="timeRange" label="Time Range" rules={[{ required: true }]}>
            <DatePicker.RangePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn-go" style={{ flex: 1 }}>Generate Slot</button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Scheduling;
