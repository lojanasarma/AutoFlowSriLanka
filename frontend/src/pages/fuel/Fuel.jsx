import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Select, InputNumber, message } from 'antd';
import { fuelService } from '../../services/fuelService';
import { vehicleService } from '../../services/vehicleService';

const { Option } = Select;

const Fuel = () => {
  const [logs, setLogs] = useState([]);
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
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
      const [stationData, vehicleData] = await Promise.all([
        fuelService.getAllStations(),
        currentUser.role === 'CUSTOMER' ? vehicleService.getMyGarage() : vehicleService.getAllVehicles()
      ]);
      setStations(stationData || []);
      setVehicles(vehicleData || []);
      
      const allLogs = [];
      for (const v of (vehicleData || [])) {
        const vLogs = await fuelService.getLogsByVehicle(v.vehicleId);
        allLogs.push(...(vLogs || []));
      }
      allLogs.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
      setLogs(allLogs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleRecordLog = async (values) => {
    try {
      const logData = {
        vehicle: { vehicleId: values.vehicleId },
        station: { stationId: values.stationId },
        quantity: values.liters,
        odometer: values.odometerReading,
        fuelType: 'PETROL' // Adding a default fuelType since it is not null
      };
      await fuelService.recordFuelLog(logData);
      message.success('Fuel log recorded successfully');
      setIsModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        message.error(error.response.data);
      } else {
        message.error('Failed to record fuel');
      }
    }
  };

  const handleApprove = async (logId) => {
    try {
      await fuelService.updateLogStatus(logId, 'APPROVED');
      message.success('Log approved');
      fetchData();
    } catch (error) {
      message.error('Failed to approve log');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fuelService.deleteFuelLog(id);
      message.success('Log deleted');
      fetchData();
    } catch (error) {
      message.error('Failed to delete log');
    }
  };

  return (
    <div className="panel on">
      <div className="sh">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="sh-eye">Fuel Management</div>
            <h1>Fuel Logs</h1>
            <div className="sh-sub">Track fuel consumption and station dispensing.</div>
          </div>
          <button className="btn-go" onClick={() => setIsModalVisible(true)}>+ Refuel</button>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div className="ch" style={{ marginBottom: '24px' }}>
          <div className="ct">Dispensing History</div>
        </div>

        {logs.length > 0 ? (
          <div className="tl">
            {logs.map((log) => (
              <div className="tl-item" key={log.logId}>
                <div className="tl-dot td-bl">â›½</div>
                <div className="tl-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="tl-title" style={{ fontSize: '16px' }}>{log.quantity}L @ {log.station ? log.station.name : 'Unknown Station'}</div>
                    <div className="tl-meta" style={{ marginTop: '6px' }}>
                      <span className={`badge ${log.status === 'APPROVED' || log.status === 'VERIFIED' ? 'b-gr' : log.status === 'REJECTED' ? 'b-er' : 'b-am'}`}>{log.status}</span>
                      <span style={{ marginLeft: '12px' }}>Vehicle: {log.vehicle ? log.vehicle.regNo || log.vehicle.registrationNo : 'Unknown'}</span>
                      <span style={{ marginLeft: '12px' }}>â€¢ Odo: {log.odometer} km</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>Dispensed: {log.recordedAt ? new Date(log.recordedAt).toLocaleString() : 'N/A'}</div>
                  </div>
                  
                  {/* Action Buttons for Staff */}
                  {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'FUEL_STATION_MANAGER') && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {log.status === 'PENDING' && <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'var(--green)', color: '#000' }} onClick={() => handleApprove(log.logId)}>Approve</button>}
                      <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }} onClick={() => handleDelete(log.logId)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ padding: '40px' }}>
            <div className="empty-ic" style={{ fontSize: '32px' }}>â›½</div>
            <div className="empty-tx">No fuel logs found</div>
          </div>
        )}
      </div>

      <Modal title={<span style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '20px' }}>Record Fuel Log</span>} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null} className="custom-modal">
        <Form form={form} layout="vertical" onFinish={handleRecordLog}>
          <Form.Item name="vehicleId" label="Vehicle" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select Vehicle">
              {vehicles.map(v => <Option key={v.vehicleId} value={v.vehicleId}>{v.regNo || v.registrationNo}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="stationId" label="Fuel Station" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select Station">
              {stations.map(s => <Option key={s.stationId} value={s.stationId}>{s.name} - {s.location}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="liters" label="Liters" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0.1} step={0.1} />
          </Form.Item>
          <Form.Item name="odometerReading" label="Current Odometer" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn-go" style={{ flex: 1 }}>Submit Log</button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Fuel;

