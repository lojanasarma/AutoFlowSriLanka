import React, { useEffect, useState } from 'react';
import { Form, Input, Modal, Select, message } from 'antd';
import { schedulingService } from '../services/schedulingService';
import { fuelService } from '../services/fuelService';

const Locations = () => {
  const [centres, setCentres] = useState([]);
  const [bays, setBays] = useState([]);
  const [stations, setStations] = useState([]);
  const [centreId, setCentreId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [kind, setKind] = useState('centre');
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const refresh = async () => {
    try {
      const [centreRows, stationRows] = await Promise.all([
        schedulingService.getAllCentres(), fuelService.getAllStations()
      ]);
      setCentres(centreRows || []);
      setStations(stationRows || []);
      const activeCentre = centreRows?.some((centre) => centre.centreId === centreId)
        ? centreId : centreRows?.[0]?.centreId;
      if (activeCentre) setCentreId(activeCentre);
    } catch (error) {
      message.error('Could not load locations and stations');
    }
  };

  const refreshBays = async (id) => {
    if (!id) { setBays([]); return; }
    try { setBays(await schedulingService.getBaysByCentre(id) || []); }
    catch { message.error('Could not load service bays'); }
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => { refreshBays(centreId); }, [centreId]);

  const openEditor = (nextKind, record = null) => {
    setKind(nextKind);
    setEditing(record);
    form.setFieldsValue(record ? {
      name: record.name,
      location: record.location,
      status: record.status || 'AVAILABLE'
    } : { name: '', location: '', status: 'AVAILABLE' });
    setIsOpen(true);
  };

  const save = async (values) => {
    try {
      if (kind === 'centre') {
        if (editing) await schedulingService.updateCentre(editing.centreId, values);
        else await schedulingService.createCentre(values);
      } else if (kind === 'bay') {
        const data = { name: values.name, status: values.status, centre: { centreId } };
        if (editing) await schedulingService.updateBay(editing.bayId, data);
        else await schedulingService.createBay(data);
      } else {
        if (editing) await fuelService.updateStation(editing.stationId, values);
        else await fuelService.createStation(values);
      }
      message.success(`${kind === 'centre' ? 'Service centre' : kind === 'bay' ? 'Service bay' : 'Fuel station'} saved`);
      setIsOpen(false);
      form.resetFields();
      await refresh();
      if (kind === 'bay') await refreshBays(centreId);
    } catch (error) {
      message.error(error.response?.data || `Could not save ${kind}`);
    }
  };

  const remove = async (type, record) => {
    try {
      if (type === 'bay') await schedulingService.deleteBay(record.bayId);
      else if (type === 'centre') await schedulingService.deleteCentre(record.centreId);
      else await fuelService.deleteStation(record.stationId);
      message.success(`${type === 'bay' ? 'Service bay' : type === 'centre' ? 'Service centre' : 'Fuel station'} deleted`);
      if (type === 'bay') await refreshBays(centreId); else await refresh();
    } catch (error) {
      const data = error.response?.data;
      message.error((typeof data === 'string' && data) || data?.message || `Could not delete ${type}`);
    }
  };

  const cardStyle = { padding: 18, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 };
  const buttonStyle = { padding: '6px 12px', fontSize: 11, minHeight: 0 };

  return (
    <div className="panel on">
      <div className="sh">
        <div className="sh-eye">System Administration</div>
        <h1>Locations & Stations</h1>
        <div className="sh-sub">Manage workshop service centres, service bays, and fuel stations.</div>
      </div>

      <div className="g2">
        <section className="card" style={{ padding: 22 }}>
          <div className="ch"><div className="ct">Service Centres / Workshops</div><button className="btn-go" onClick={() => openEditor('centre')}>+ Add</button></div>
          {centres.map((centre) => <div className="card" style={cardStyle} key={centre.centreId}>
            <div><strong>{centre.name}</strong><div className="cc-meta">{centre.location}</div></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-go" style={buttonStyle} onClick={() => openEditor('centre', centre)}>Edit</button>
              <button className="btn-go" style={{ ...buttonStyle, color: 'var(--red)' }} onClick={() => remove('centre', centre)}>Delete</button>
            </div>
          </div>)}
          {!centres.length && <div className="empty-tx">No service centres configured.</div>}
        </section>

        <section className="card" style={{ padding: 22 }}>
          <div className="ch"><div className="ct">Service Bays</div><button className="btn-go" disabled={!centres.length} onClick={() => openEditor('bay')}>+ Add</button></div>
          <Select style={{ width: '100%', marginBottom: 16 }} value={centreId} onChange={setCentreId} placeholder="Choose a service centre">
            {centres.map((centre) => <Select.Option key={centre.centreId} value={centre.centreId}>{centre.name}</Select.Option>)}
          </Select>
          {bays.map((bay) => <div className="card" style={cardStyle} key={bay.bayId}>
            <div><strong>{bay.name}</strong><div className="cc-meta">{bay.status || 'AVAILABLE'} · Bay #{bay.bayId}</div></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-go" style={buttonStyle} onClick={() => openEditor('bay', bay)}>Edit</button>
              <button className="btn-go" style={{ ...buttonStyle, color: 'var(--red)' }} onClick={() => remove('bay', bay)}>Delete</button>
            </div>
          </div>)}
          {!bays.length && <div className="empty-tx">No bays at this centre.</div>}
        </section>

        <section className="card" style={{ padding: 22, gridColumn: '1 / -1' }}>
          <div className="ch"><div className="ct">Fuel Stations</div><button className="btn-go" onClick={() => openEditor('station')}>+ Add Station</button></div>
          <div className="g2">
            {stations.map((station) => <div className="card" style={cardStyle} key={station.stationId}>
              <div><strong>{station.name}</strong><div className="cc-meta">{station.location}</div></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-go" style={buttonStyle} onClick={() => openEditor('station', station)}>Edit</button>
                <button className="btn-go" style={{ ...buttonStyle, color: 'var(--red)' }} onClick={() => remove('station', station)}>Delete</button>
              </div>
            </div>)}
          </div>
          {!stations.length && <div className="empty-tx">No fuel stations configured.</div>}
        </section>
      </div>

      <Modal title={<span style={{ color: '#fff' }}>{editing ? 'Edit' : 'Add'} {kind === 'centre' ? 'Service Centre' : kind === 'bay' ? 'Service Bay' : 'Fuel Station'}</span>} open={isOpen} onCancel={() => setIsOpen(false)} footer={null} className="custom-modal">
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name" label={kind === 'bay' ? 'Bay Name' : 'Name'} rules={[{ required: true, whitespace: true }]}><Input maxLength={100} /></Form.Item>
          {kind !== 'bay' && <Form.Item name="location" label="Location" rules={[{ required: true, whitespace: true }]}><Input maxLength={255} /></Form.Item>}
          {kind === 'bay' && <Form.Item name="status" label="Status"><Select><Select.Option value="AVAILABLE">Available</Select.Option><Select.Option value="INACTIVE">Inactive</Select.Option></Select></Form.Item>}
          <button type="submit" className="btn-go" style={{ width: '100%' }}>Save</button>
        </Form>
      </Modal>
    </div>
  );
};

export default Locations;
