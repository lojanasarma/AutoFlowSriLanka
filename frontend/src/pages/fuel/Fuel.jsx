import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Form, Input, InputNumber, Modal, Select, Table, Tag, message } from 'antd';
import { fuelService } from '../../services/fuelService';
import { vehicleService } from '../../services/vehicleService';

const { Option } = Select;
const money = (value) => `LKR ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const liters = (value) => `${Number(value || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })} L`;

const Fuel = () => {
  const [logs, setLogs] = useState([]);
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('day');
  const [reportStationId, setReportStationId] = useState(null);
  const [selectedStockStation, setSelectedStockStation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRefuelVisible, setIsRefuelVisible] = useState(false);
  const [isStationVisible, setIsStationVisible] = useState(false);
  const [isTypeVisible, setIsTypeVisible] = useState(false);
  const [isInventoryVisible, setIsInventoryVisible] = useState(false);
  const [isStockVisible, setIsStockVisible] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);
  const [stockTarget, setStockTarget] = useState(null);
  const [refuelForm] = Form.useForm();
  const [stationForm] = Form.useForm();
  const [typeForm] = Form.useForm();
  const [inventoryForm] = Form.useForm();
  const [stockForm] = Form.useForm();
  const selectedRefuelStationId = Form.useWatch('stationId', refuelForm);

  const isManager = ['ADMIN', 'FUEL_STATION_MANAGER'].includes(currentUser?.role);
  const availableRefuelTypes = useMemo(() => {
    if (selectedRefuelStationId == null || selectedRefuelStationId === '') return [];
    // Ant Design may return a string value while the API's station IDs are numbers.
    // Compare normalized IDs so valid inventory is not hidden by a type mismatch.
    return inventory.filter(item => String(item.station?.stationId) === String(selectedRefuelStationId)
      && Number(item.availableLitres) > 0 && item.fuelType?.status === 'ACTIVE');
  }, [inventory, selectedRefuelStationId]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [stationData, typeData, inventoryData, vehicleData] = await Promise.all([
        fuelService.getAllStations(),
        fuelService.getFuelTypes(),
        fuelService.getInventory(),
        currentUser.role === 'CUSTOMER' ? vehicleService.getMyGarage() : vehicleService.getAllVehicles()
      ]);
      setStations(stationData || []);
      setFuelTypes(typeData || []);
      setInventory(inventoryData || []);
      setVehicles(vehicleData || []);

      const logsByLocation = currentUser.role === 'CUSTOMER'
        ? await Promise.all((vehicleData || []).map(vehicle => fuelService.getLogsByVehicle(vehicle.vehicleId)))
        : await Promise.all((stationData || []).map(station => fuelService.getLogsByStation(station.stationId)));
      const allLogs = logsByLocation.flat().sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
      setLogs(allLogs);

      if (['ADMIN', 'FUEL_STATION_MANAGER'].includes(currentUser.role)) {
        const [stockMovements, report] = await Promise.all([
          fuelService.getStockMovements(selectedStockStation),
          fuelService.getSummary(reportPeriod, reportStationId)
        ]);
        setMovements(stockMovements || []);
        setSummary(report);
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data || 'Could not load fuel management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentUser, reportPeriod, reportStationId, selectedStockStation]);

  const refreshReport = async (period = reportPeriod, stationId = reportStationId) => {
    try { setSummary(await fuelService.getSummary(period, stationId)); }
    catch (error) { message.error(error.response?.data || 'Could not load fuel summary'); }
  };

  const handleRecordLog = async (values) => {
    try {
      await fuelService.recordFuelLog({
        vehicle: { vehicleId: values.vehicleId },
        station: { stationId: values.stationId },
        quantity: values.liters,
        odometer: values.odometerReading,
        fuelType: fuelTypes.find(type => type.fuelTypeId === values.fuelTypeId)?.code
      });
      message.success('Fuel log recorded and stock reserved');
      setIsRefuelVisible(false);
      refuelForm.resetFields();
      await fetchData();
    } catch (error) { message.error(error.response?.data || 'Failed to record refuel'); }
  };

  const handleLogStatus = async (logId, status) => {
    try {
      await fuelService.updateLogStatus(logId, status);
      message.success(status === 'APPROVED' ? 'Log approved and fuel stock deducted' : 'Log rejected and reserved stock released');
      await fetchData();
    } catch (error) { message.error(error.response?.data || `Failed to ${status.toLowerCase()} log`); }
  };

  const handleDeleteLog = async (id) => {
    try {
      await fuelService.deleteFuelLog(id);
      message.success('Pending fuel log deleted and stock reservation released');
      await fetchData();
    } catch (error) { message.error(error.response?.data || 'Approved dispensing logs cannot be deleted'); }
  };

  const openStationForm = (station = null) => {
    setEditingStation(station);
    stationForm.setFieldsValue(station || { name: '', location: '' });
    setIsStationVisible(true);
  };

  const saveStation = async (values) => {
    try {
      if (editingStation) await fuelService.updateStation(editingStation.stationId, values);
      else await fuelService.createStation(values);
      message.success(editingStation ? 'Station information updated' : 'Fuel station added');
      setIsStationVisible(false);
      await fetchData();
    } catch (error) { message.error(error.response?.data || 'Could not save fuel station'); }
  };

  const deleteStation = async (stationId) => {
    try {
      await fuelService.deleteStation(stationId);
      message.success('Fuel station removed');
      await fetchData();
    } catch (error) { message.error(error.response?.data || 'A station with inventory or logs cannot be deleted'); }
  };

  const createFuelType = async (values) => {
    try {
      await fuelService.createFuelType(values);
      message.success('Fuel type added');
      setIsTypeVisible(false);
      typeForm.resetFields();
      await fetchData();
    } catch (error) { message.error(error.response?.data || 'Could not add fuel type'); }
  };

  const toggleFuelType = async (type) => {
    try {
      const status = type.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await fuelService.updateFuelTypeStatus(type.fuelTypeId, status);
      message.success(`Fuel type ${status.toLowerCase()}`);
      await fetchData();
    } catch (error) { message.error(error.response?.data || 'Could not update fuel type'); }
  };

  const openInventoryForm = (item = null) => {
    setEditingInventory(item);
    inventoryForm.setFieldsValue(item ? {
      stationId: item.station.stationId,
      fuelTypeId: item.fuelType.fuelTypeId,
      capacityLitres: Number(item.capacityLitres),
      lowStockThreshold: Number(item.lowStockThreshold),
      pricePerLitre: Number(item.pricePerLitre)
    } : { openingStockLitres: 0, capacityLitres: 1000, lowStockThreshold: 100, pricePerLitre: 0 });
    setIsInventoryVisible(true);
  };

  const saveInventory = async (values) => {
    try {
      if (editingInventory) {
        await fuelService.updateInventory(editingInventory.inventoryId, values);
        message.success('Fuel price and stock thresholds updated');
      } else {
        await fuelService.createInventory(values);
        message.success('Fuel type configured for station');
      }
      setIsInventoryVisible(false);
      await fetchData();
    } catch (error) { message.error(error.response?.data || 'Could not save station inventory'); }
  };

  const openStockForm = (item) => {
    setStockTarget(item);
    stockForm.resetFields();
    setIsStockVisible(true);
  };

  const saveStockUpdate = async (values) => {
    try {
      await fuelService.updateStock(stockTarget.inventoryId, values);
      message.success(Number(values.quantityDelta) > 0 ? 'Fuel stock received and logged' : 'Stock adjustment recorded');
      setIsStockVisible(false);
      await fetchData();
    } catch (error) { message.error(error.response?.data || 'Could not update fuel stock'); }
  };

  const movementColumns = [
    { title: 'Time', dataIndex: 'occurredAt', render: value => value ? new Date(value).toLocaleString() : '—' },
    { title: 'Station', render: (_, row) => row.inventory?.station?.name || '—' },
    { title: 'Fuel', render: (_, row) => row.inventory?.fuelType?.name || '—' },
    { title: 'Action', dataIndex: 'action', render: value => <Tag color={value === 'DISPENSE' ? 'orange' : value === 'STOCK_IN' || value === 'OPENING_BALANCE' ? 'green' : 'blue'}>{value}</Tag> },
    { title: 'Change', dataIndex: 'quantityDelta', render: value => liters(value) },
    { title: 'Stock before → after', render: (_, row) => `${liters(row.stockBefore)} → ${liters(row.stockAfter)}` },
    { title: 'By', render: (_, row) => row.actor?.fullName || row.actor?.email || '—' },
    { title: 'Reason', dataIndex: 'reason' }
  ];

  return (
    <div className="panel on">
      <div className="sh">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div className="sh-eye">Fuel Operations</div>
            <h1>{isManager ? 'Fuel Station Management' : 'Fuel Logs'}</h1>
            <div className="sh-sub">Manage station stock, prices, dispensing records, and fuel usage.</div>
          </div>
          <button className="btn-go" onClick={() => { refuelForm.resetFields(); setIsRefuelVisible(true); }}>+ Record Refuel</button>
        </div>
      </div>

      {isManager && <>
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="ch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div className="ct">Daily and Monthly Summary</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Select value={reportPeriod} onChange={value => { setReportPeriod(value); refreshReport(value); }} style={{ width: 130 }}>
                <Option value="day">Today</Option><Option value="month">This month</Option>
              </Select>
              <Select allowClear value={reportStationId} placeholder="All stations" onChange={value => { setReportStationId(value); refreshReport(reportPeriod, value); }} style={{ width: 190 }}>
                {stations.map(station => <Option key={station.stationId} value={station.stationId}>{station.name}</Option>)}
              </Select>
            </div>
          </div>
          <div className="sg sg-3" style={{ marginTop: 14 }}>
            <div className="sc"><div className="sc-label">Approved Dispensing</div><div className="sc-val">{summary?.approvedTransactions ?? 0}</div></div>
            <div className="sc"><div className="sc-label">Litres Dispensed</div><div className="sc-val">{liters(summary?.litresDispensed)}</div></div>
            <div className="sc"><div className="sc-label">Sales Value</div><div className="sc-val">{money(summary?.salesValue)}</div></div>
            <div className="sc"><div className="sc-label">Pending Refuels</div><div className="sc-val">{summary?.pendingTransactions ?? 0}</div></div>
            <div className="sc"><div className="sc-label">Low-stock Items</div><div className="sc-val" style={{ color: summary?.lowStockItems ? 'var(--red)' : undefined }}>{summary?.lowStockItems ?? 0}</div></div>
          </div>
          {summary?.byFuelType?.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
            {summary.byFuelType.map(item => <Tag key={item.fuelType}>{item.fuelType}: {liters(item.litres)} · {money(item.salesValue)}</Tag>)}
          </div>}
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="ch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="ct">Fuel Stations</div>
            <button className="btn-go" onClick={() => openStationForm()}>+ Add Station</button>
          </div>
          <div className="sg sg-3" style={{ marginTop: 14 }}>
            {stations.map(station => <div className="sc" key={station.stationId}>
              <div className="sc-label">Station {station.stationId}</div>
              <div className="sc-val" style={{ fontSize: 19 }}>{station.name}</div>
              <div className="sc-sub">{station.location}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn-go" onClick={() => openStationForm(station)}>Edit</button>
                <button className="btn-go" style={{ color: 'var(--red)' }} onClick={() => deleteStation(station.stationId)}>Delete</button>
              </div>
            </div>)}
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="ch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="ct">Fuel Types</div>
            <button className="btn-go" onClick={() => setIsTypeVisible(true)}>+ Add Fuel Type</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {fuelTypes.map(type => <Tag key={type.fuelTypeId} color={type.status === 'ACTIVE' ? 'green' : 'default'}>
              {type.name} ({type.code})
              <button type="button" onClick={() => toggleFuelType(type)} style={{ marginLeft: 10, border: 0, background: 'transparent', cursor: 'pointer' }}>
                {type.status === 'ACTIVE' ? 'Disable' : 'Enable'}
              </button>
            </Tag>)}
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="ch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="ct">Station Fuel Stock and Prices</div>
            <button className="btn-go" onClick={() => openInventoryForm()}>+ Configure Fuel</button>
          </div>
          {inventory.some(item => item.lowStock) && <Alert type="warning" showIcon message="Low fuel stock" description="One or more station fuel types are at or below their reorder threshold." style={{ marginBottom: 16 }} />}
          <div className="sg sg-3" style={{ marginTop: 14 }}>
            {inventory.map(item => <div className="sc" key={item.inventoryId}>
              <div className="sc-label">{item.station?.name} · {item.fuelType?.name}</div>
              <div className="sc-val" style={{ fontSize: 20 }}>{liters(item.availableLitres)} available</div>
              <div className="sc-sub">Stock {liters(item.stockLitres)} · Reserved {liters(item.reservedLitres)} · Capacity {liters(item.capacityLitres)}</div>
              <div className="sc-sub">Price: {money(item.pricePerLitre)} / L · Reorder at {liters(item.lowStockThreshold)}</div>
              {item.lowStock && <Tag color="red" style={{ marginTop: 8 }}>LOW STOCK</Tag>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn-go" onClick={() => openStockForm(item)}>Update Stock</button>
                <button className="btn-go" onClick={() => openInventoryForm(item)}>Price / Threshold</button>
              </div>
            </div>)}
          </div>
          {!inventory.length && <div className="empty" style={{ padding: 28 }}><div className="empty-tx">Configure a station and fuel type, then add its opening stock.</div></div>}
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="ch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div className="ct">Stock Update History</div>
            <Select allowClear value={selectedStockStation} placeholder="All stations" onChange={setSelectedStockStation} style={{ width: 190 }}>
              {stations.map(station => <Option key={station.stationId} value={station.stationId}>{station.name}</Option>)}
            </Select>
          </div>
          <Table rowKey="movementId" columns={movementColumns} dataSource={movements} loading={loading} scroll={{ x: 1000 }} pagination={{ pageSize: 8 }} />
        </div>
      </>}

      <div className="card" style={{ padding: 24 }}>
        <div className="ch" style={{ marginBottom: 24 }}><div className="ct">Fuel Dispensing and Vehicle History</div></div>
        {logs.length ? <div className="tl">
          {logs.map(log => <div className="tl-item" key={log.logId}>
            <div className="tl-dot td-bl">⛽</div>
            <div className="tl-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div>
                <div className="tl-title" style={{ fontSize: 16 }}>{log.quantity} L {log.fuelType} @ {log.station?.name || 'Unknown station'}</div>
                <div className="tl-meta" style={{ marginTop: 6 }}>
                  <Tag color={log.status === 'APPROVED' ? 'green' : log.status === 'REJECTED' ? 'red' : 'orange'}>{log.status}</Tag>
                  <span style={{ marginLeft: 8 }}>Vehicle: {log.vehicle?.regNo || 'Unknown'}</span>
                  <span style={{ marginLeft: 8 }}>Odometer: {log.odometer} km</span>
                  {log.cost != null && <span style={{ marginLeft: 8 }}>{money(log.cost)}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Recorded: {log.recordedAt ? new Date(log.recordedAt).toLocaleString() : 'N/A'}{log.approvedAt ? ` · Approved: ${new Date(log.approvedAt).toLocaleString()} by ${log.approvedBy?.fullName || 'staff'}` : ''}</div>
              </div>
              {isManager && log.status === 'PENDING' && <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-go" style={{ background: 'var(--green)', color: '#000' }} onClick={() => handleLogStatus(log.logId, 'APPROVED')}>Approve</button>
                <button className="btn-go" style={{ color: 'var(--red)' }} onClick={() => handleLogStatus(log.logId, 'REJECTED')}>Reject</button>
                <button className="btn-go" style={{ color: 'var(--muted)' }} onClick={() => handleDeleteLog(log.logId)}>Clear</button>
              </div>}
            </div>
          </div>)}
        </div> : <div className="empty" style={{ padding: 40 }}><div className="empty-tx">No fuel logs found</div></div>}
      </div>

      <Modal title={editingStation ? 'Edit Fuel Station' : 'Add Fuel Station'} open={isStationVisible} onCancel={() => setIsStationVisible(false)} footer={null} className="custom-modal">
        <Form form={stationForm} layout="vertical" onFinish={saveStation}>
          <Form.Item name="name" label="Station name" rules={[{ required: true }]}><Input maxLength={100} /></Form.Item>
          <Form.Item name="location" label="Location" rules={[{ required: true }]}><Input maxLength={255} /></Form.Item>
          <button type="submit" className="btn-go" style={{ width: '100%' }}>Save station</button>
        </Form>
      </Modal>

      <Modal title="Add Fuel Type" open={isTypeVisible} onCancel={() => setIsTypeVisible(false)} footer={null} className="custom-modal">
        <Form form={typeForm} layout="vertical" onFinish={createFuelType}>
          <Form.Item name="code" label="Code (for example, DIESEL)" rules={[{ required: true }]}><Input maxLength={20} /></Form.Item>
          <Form.Item name="name" label="Display name" rules={[{ required: true }]}><Input maxLength={60} /></Form.Item>
          <button type="submit" className="btn-go" style={{ width: '100%' }}>Add fuel type</button>
        </Form>
      </Modal>

      <Modal title={editingInventory ? 'Update Price and Thresholds' : 'Configure Station Fuel'} open={isInventoryVisible} onCancel={() => setIsInventoryVisible(false)} footer={null} className="custom-modal">
        <Form form={inventoryForm} layout="vertical" onFinish={saveInventory}>
          {!editingInventory && <>
            <Form.Item name="stationId" label="Station" rules={[{ required: true }]}><Select>{stations.map(s => <Option key={s.stationId} value={s.stationId}>{s.name} · {s.location}</Option>)}</Select></Form.Item>
            <Form.Item name="fuelTypeId" label="Fuel type" rules={[{ required: true }]}><Select>{fuelTypes.map(t => <Option key={t.fuelTypeId} value={t.fuelTypeId}>{t.name}</Option>)}</Select></Form.Item>
            <Form.Item name="openingStockLitres" label="Opening stock (litres)" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
          </>}
          <Form.Item name="capacityLitres" label="Tank capacity (litres)" rules={[{ required: true }]}><InputNumber min={0.01} precision={2} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="lowStockThreshold" label="Low-stock threshold (litres)" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="pricePerLitre" label="Price per litre (LKR)" rules={[{ required: true }]}><InputNumber min={0.01} precision={2} style={{ width: '100%' }} /></Form.Item>
          <button type="submit" className="btn-go" style={{ width: '100%' }}>Save inventory</button>
        </Form>
      </Modal>

      <Modal title={`Update stock · ${stockTarget?.station?.name || ''} ${stockTarget?.fuelType?.name || ''}`} open={isStockVisible} onCancel={() => setIsStockVisible(false)} footer={null} className="custom-modal">
        <Form form={stockForm} layout="vertical" onFinish={saveStockUpdate}>
          <div style={{ color: 'var(--muted)', marginBottom: 14 }}>Current stock {liters(stockTarget?.stockLitres)}; reserved {liters(stockTarget?.reservedLitres)}; available {liters(stockTarget?.availableLitres)}.</div>
          <Form.Item name="quantityDelta" label="Change in litres (positive receive, negative adjustment)" rules={[{ required: true }]}><InputNumber precision={2} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="reason" label="Reason / delivery reference" rules={[{ required: true }]}><Input maxLength={255} /></Form.Item>
          <button type="submit" className="btn-go" style={{ width: '100%' }}>Record stock update</button>
        </Form>
      </Modal>

      <Modal title="Record Fuel Dispensing" open={isRefuelVisible} onCancel={() => setIsRefuelVisible(false)} footer={null} className="custom-modal">
        <Form form={refuelForm} layout="vertical" onFinish={handleRecordLog}>
          <Form.Item name="vehicleId" label="Vehicle" rules={[{ required: true }]}><Select showSearch optionFilterProp="children">{vehicles.map(v => <Option key={v.vehicleId} value={v.vehicleId}>{v.regNo || v.registrationNo}</Option>)}</Select></Form.Item>
          <Form.Item name="stationId" label="Fuel station" rules={[{ required: true }]}>
            <Select onChange={() => refuelForm.setFieldValue('fuelTypeId', undefined)}>{stations.map(s => <Option key={s.stationId} value={s.stationId}>{s.name} · {s.location}</Option>)}</Select>
          </Form.Item>
          <Form.Item name="fuelTypeId" label="Available fuel" rules={[{ required: true }]}>
            <Select
              disabled={selectedRefuelStationId == null || selectedRefuelStationId === ''}
              placeholder={selectedRefuelStationId ? 'Choose available fuel' : 'Select a station first'}
              notFoundContent={selectedRefuelStationId ? 'No active fuel with stock is configured at this station' : 'Select a station first'}
            >
              {availableRefuelTypes.map(item => <Option key={item.fuelType.fuelTypeId} value={item.fuelType.fuelTypeId}>
                {item.fuelType.name} · {money(item.pricePerLitre)}/L · {liters(item.availableLitres)} available
              </Option>)}
            </Select>
          </Form.Item>
          {selectedRefuelStationId && availableRefuelTypes.length === 0 && <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="No fuel is available at this station"
            description={isManager
              ? 'Configure this station under Station Fuel Stock and Prices, then add opening stock and a price.'
              : 'Please choose another station or contact the Fuel Station Manager to configure fuel stock.'}
          />}
          <Form.Item name="liters" label="Litres" rules={[{ required: true }, { type: 'number', min: 0.1, max: 200 }]}><InputNumber min={0.1} max={200} precision={2} step={0.1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="odometerReading" label="Current odometer (km)" rules={[{ required: true }]}><InputNumber min={0} precision={0} style={{ width: '100%' }} /></Form.Item>
          <div style={{ color: 'var(--muted)', marginBottom: 14 }}>Fuel logs reserve station stock immediately. The stock is deducted when the manager approves the log.</div>
          <button type="submit" className="btn-go" style={{ width: '100%' }}>Record refuel</button>
        </Form>
      </Modal>
    </div>
  );
};

export default Fuel;
