import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { vehicleService } from '../../services/vehicleService';
import { userService } from '../../services/userService';

const { Option } = Select;

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
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
        const myVehicles = await vehicleService.getMyGarage();
        setVehicles(myVehicles || []);
      } else {
        const vehicleData = await vehicleService.getAllVehicles();
        setVehicles(vehicleData || []);
        if (['ADMIN', 'CUSTOMER_SERVICE_OFFICER'].includes(currentUser.role)) {
          const userData = await userService.getAllUsers();
          setUsers((userData || []).filter(u => u.status === 'ACTIVE' && u.role === 'CUSTOMER'));
        }
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

  const handleAddOrEditVehicle = async (values) => {
    try {
      if (editingVehicle) {
        let vehicleData = { ...values };
        vehicleData.status = 'ACTIVE';
        await vehicleService.updateVehicle(editingVehicle.vehicleId, vehicleData);
        message.success('Vehicle updated successfully');
        fetchData();
      } else {
        let vehicleData = { ...values };
        if (values.ownerId) vehicleData.ownerId = values.ownerId;
        if (vehicleData.registrationNo) vehicleData.regNo = vehicleData.registrationNo;
        
        await vehicleService.createVehicle(vehicleData);
        message.success('Vehicle created successfully');
        fetchData();
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingVehicle(null);
    } catch (error) {
      message.error('Failed to process vehicle');
    }
  };

  const handleDelete = async (id) => {
    try {
      await vehicleService.deleteVehicle(id);
      message.success('Vehicle deleted');
      fetchData();
    } catch (error) {
      message.error('Failed to delete vehicle');
    }
  };

  const openEditModal = (car) => {
    setEditingVehicle(car);
    form.setFieldsValue({
      registrationNo: car.regNo || car.registrationNo,
      make: car.make,
      model: car.model,
      year: car.year,
      fuelType: car.fuelType,
      mileage: car.mileage,
      ownerId: car.owner?.userId
    });
    setIsModalVisible(true);
  };

  const canCreate = ['ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'CUSTOMER'].includes(currentUser?.role);
  const canEdit = ['ADMIN', 'CUSTOMER_SERVICE_OFFICER', 'WORKSHOP_OPERATIONS_MANAGER'].includes(currentUser?.role);
  const canDelete = ['ADMIN', 'CUSTOMER_SERVICE_OFFICER'].includes(currentUser?.role);

  return (
    <div id="panel-cars" className="panel on">
      <div className="sh">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="sh-eye">Fleet Management</div>
            <h1>{currentUser?.role === 'CUSTOMER' ? 'My Garage' : 'All Vehicles'}</h1>
            <div className="sh-sub">View, add and manage registered vehicles.</div>
          </div>
          {canCreate && (
            <button className="btn-go" onClick={() => { setEditingVehicle(null); form.resetFields(); setIsModalVisible(true); }}>+ Add Vehicle</button>
          )}
        </div>
      </div>

      <div className="car-grid">
        {vehicles.map(car => (
          <div className="car-card" key={car.vehicleId}>
            <div className="cc-top">
              <span className="cc-plate">{car.regNo || car.registrationNo}</span>
              <span className="badge b-gr">Active</span>
            </div>
            <div className="cc-name">{car.make} {car.model}</div>
            <div className="cc-meta">{car.fuelType} â€¢ {car.year}</div>
            <div className="cc-stats">
              <div>
                <span className="cc-sv">{Number(car.mileage).toLocaleString()}km</span>
                <span className="cc-sl">Mileage</span>
              </div>
              <div>
                <span className="cc-sv">{car.year}</span>
                <span className="cc-sl">Year</span>
              </div>
              <div>
                <span className="cc-sv">{car.fuelType}</span>
                <span className="cc-sl">Fuel</span>
              </div>
            </div>
            {currentUser?.role !== 'CUSTOMER' && car.owner && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted)' }}>
                Owner: <span style={{ color: '#fff' }}>{car.owner.fullName}</span>
              </div>
            )}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {canEdit && <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'rgba(255,255,255,0.1)' }} onClick={() => openEditModal(car)}>Edit</button>}
              {canDelete && (
                <button className="btn-go" style={{ padding: '6px 12px', fontSize: '11px', minHeight: 0, background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }} onClick={() => handleDelete(car.vehicleId)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && !loading && (
        <div className="empty" style={{ padding: '40px' }}>
          <div className="empty-tx" style={{ fontSize: '14px' }}>No vehicles found</div>
        </div>
      )}

      <Modal title={<span style={{ color: '#fff', fontFamily: "'Rajdhani', sans-serif", fontSize: '20px' }}>{editingVehicle ? 'Edit Vehicle' : 'Register New Vehicle'}</span>} open={isModalVisible} onCancel={() => { setIsModalVisible(false); setEditingVehicle(null); }} footer={null} className="custom-modal">
        <Form form={form} layout="vertical" onFinish={handleAddOrEditVehicle}>
          <Form.Item name="registrationNo" label="Registration Number" rules={[{ required: true, message: 'Required' }, { pattern: /^[A-Z0-9-]+$/i, message: 'Alphanumeric and dashes only' }]}><Input placeholder="e.g. CAA-1234" /></Form.Item>
          <Form.Item name="make" label="Make" rules={[{ required: true }]}><Input placeholder="e.g. Toyota" /></Form.Item>
          <Form.Item name="model" label="Model" rules={[{ required: true }]}><Input placeholder="e.g. Corolla" /></Form.Item>
          <Form.Item name="year" label="Year" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1900} max={2100} /></Form.Item>
          <Form.Item name="fuelType" label="Fuel Type" rules={[{ required: true }]}>
            <Select>
              <Option value="PETROL">Petrol</Option>
              <Option value="DIESEL">Diesel</Option>
              <Option value="HYBRID">Hybrid</Option>
              <Option value="EV">Electric</Option>
            </Select>
          </Form.Item>
          <Form.Item name="mileage" label="Current Odometer (km)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          
          {currentUser && currentUser.role !== 'CUSTOMER' && (
            <Form.Item name="ownerId" label="Assign to Owner" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="children" placeholder="Select an owner">
                {users.map(user => (
                  <Option key={user.userId} value={user.userId}>{user.fullName} ({user.email})</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn-go" style={{ flex: 1 }}>{editingVehicle ? 'Save Changes' : 'Submit'}</button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Vehicles;


