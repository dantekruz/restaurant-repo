import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

// ── Status config ─────────────────────────────────────────────
const DINE_IN_FLOW   = ['Processing', 'Ready', 'Served'];
const TAKE_AWAY_FLOW = ['Processing', 'Ready', 'Out for Delivery', 'Delivered'];

const statusColor = (s) => ({
  Processing:         '#FF9800',
  Ready:              '#3B82F6',
  'Out for Delivery': '#8B5CF6',
  Served:             '#22C55E',
  Delivered:          '#22C55E',
  Received:           '#22C55E',
}[s] || '#ccc');

const cardBg = (orderType, status) => {
  if (['Served', 'Delivered', 'Received'].includes(status)) return { bg: '#C8F7C5', badge: '#22C55E' };
  if (status === 'Ready')             return { bg: '#DBEAFE', badge: '#3B82F6' };
  if (status === 'Out for Delivery')  return { bg: '#EDE9FE', badge: '#8B5CF6' };
  if (orderType === 'Take Away')      return { bg: '#CFD8DC', badge: '#78909C' };
  return { bg: '#FFE0B2', badge: '#FF9800' };
};

const getNextStatus = (orderType, current) => {
  const flow = orderType === 'Dine In' ? DINE_IN_FLOW : TAKE_AWAY_FLOW;
  const idx  = flow.indexOf(current);
  return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
};

const isCompleted = (orderType, status) =>
  orderType === 'Dine In'
    ? status === 'Served'
    : ['Delivered', 'Received'].includes(status);

// ── SVG Icons ─────────────────────────────────────────────────
const ProcessingIcon = ({ color = '#D87300' }) => (
  <svg width="9" height="15" viewBox="0 0 9 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 13.3376V13.2072C0 11.2475 1.93858 9.25665 2.92269 8.23641C3.45427 7.67973 3.5017 7.0651 2.92269 6.45875C1.93858 5.43644 0 3.45598 0 1.48586V1.37411C0 0.465626 0.492055 0 1.31215 0H7.65156C8.47165 0 8.96371 0.465626 8.96371 1.37411V1.48586C8.96371 3.45598 7.02513 5.43644 6.04102 6.45668C5.46201 7.06303 5.50154 7.67973 6.04102 8.23434C7.02513 9.25458 8.96371 11.2454 8.96371 13.2052V13.3355C8.96371 14.244 8.47165 14.7096 7.65156 14.7096H1.31215C0.492055 14.7096 0 14.244 0 13.3355V13.3376ZM7.69108 2.96138C7.83534 2.68821 7.75827 2.46678 7.5073 2.46678H1.45641C1.19556 2.46678 1.11849 2.68821 1.27263 2.96138C1.71725 3.76019 3.37522 5.53785 3.89692 5.99312C4.32179 6.35735 4.63994 6.35735 5.05493 5.99312C5.58651 5.53785 7.24448 3.76019 7.68911 2.96138H7.69108Z" fill={color}/>
  </svg>
);

const DoneIcon = ({ color = '#0E912F' }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.12258 13.794V12.0821C2.12258 11.915 2.08363 11.8047 1.96356 11.6781L0.751473 10.4579C-0.24643 9.46001 -0.254543 8.53188 0.751473 7.53397L1.96356 6.31377C2.08201 6.19532 2.12258 6.07687 2.12258 5.91786V4.19789C2.12258 2.77162 2.77973 2.12258 4.19789 2.12258H5.91786C6.07687 2.12258 6.19532 2.08363 6.31377 1.96356L7.53397 0.751473C8.53188 -0.24643 9.46001 -0.254543 10.4579 0.751473L11.6781 1.96356C11.8047 2.08201 11.915 2.12258 12.0821 2.12258H13.794C15.2203 2.12258 15.8693 2.78785 15.8693 4.19789V5.91786C15.8693 6.07687 15.9164 6.19532 16.0364 6.31377L17.2485 7.53397C18.2464 8.53188 18.2545 9.46001 17.2485 10.4579L16.0364 11.6781C15.918 11.8047 15.8693 11.915 15.8693 12.0821V13.794C15.8693 15.2203 15.2122 15.8693 13.794 15.8693H12.0821C11.915 15.8693 11.8047 15.9164 11.6781 16.0364L10.4579 17.2485C9.46001 18.2464 8.53188 18.2545 7.53397 17.2485L6.31377 16.0364C6.19532 15.918 6.07687 15.8693 5.91786 15.8693H4.19789C2.77973 15.8693 2.12258 15.2122 2.12258 13.794ZM8.77851 12.4878L12.5024 6.6172C12.5981 6.45818 12.7004 6.27645 12.7004 6.09472C12.7004 5.72963 12.3758 5.49273 12.0351 5.49273C11.8209 5.49273 11.6148 5.61118 11.4639 5.85782L8.08079 11.2936L6.47279 9.21824C6.27483 8.957 6.10121 8.87749 5.87891 8.87749C5.51383 8.87749 5.23636 9.17118 5.23636 9.53465C5.23636 9.70827 5.30776 9.89162 5.42621 10.049L7.41552 12.4894C7.62159 12.7669 7.84389 12.8691 8.11325 12.8691C8.3826 12.8691 8.61301 12.7425 8.77851 12.4894V12.4878Z" fill={color}/>
  </svg>
);

// ── Countdown hook ────────────────────────────────────────────
// Uses estimatedReadyAt from DB if valid and in future,
// otherwise derives it from createdAt + prepTime
const useCountdown = (estimatedReadyAt, prepTime, createdAt) => {
  // Resolve the real deadline — prefer estimatedReadyAt, fallback to createdAt+prepTime
  const resolveDeadline = () => {
    const p = prepTime || 15;
    if (estimatedReadyAt) {
      const d = new Date(estimatedReadyAt);
      if (d > Date.now()) return d; // valid and in future — use it
    }
    // fallback: createdAt + prepTime minutes
    if (createdAt) return new Date(new Date(createdAt).getTime() + p * 60 * 1000);
    return new Date(Date.now() + p * 60 * 1000);
  };

  const [secsLeft, setSecsLeft] = useState(() => {
    const deadline = resolveDeadline();
    return Math.max(0, Math.round((deadline - Date.now()) / 1000));
  });

  useEffect(() => {
    const deadline = resolveDeadline();
    const getRemaining = () => Math.max(0, Math.round((deadline - Date.now()) / 1000));
    setSecsLeft(getRemaining());
    const id = setInterval(() => setSecsLeft(getRemaining()), 1000);
    return () => clearInterval(id);
  }, [estimatedReadyAt, prepTime, createdAt]);

  const minsLeft = Math.ceil(secsLeft / 60);
  const label    = minsLeft > 0
    ? `Ongoing: ${minsLeft} Min`
    : `Ongoing: ${prepTime || 15} Min`;

  return { secsLeft, minsLeft, label };
};

// ── Status dropdown ───────────────────────────────────────────
const StatusDropdown = ({ order, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const flow = order.orderType === 'Dine In' ? DINE_IN_FLOW : TAKE_AWAY_FLOW;
  const done = isCompleted(order.orderType, order.status);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const { bg, badge } = cardBg(order.orderType, order.status);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: done ? badge : statusColor(order.status),
          color: 'white',
          border: 'none',
          borderRadius: 24,
          padding: '11px 16px',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10
        }}
      >
        {done
          ? <><DoneIcon color="white" /><span>Order Done</span></>
          : <><ProcessingIcon color="white" /><span>{order.status}</span></>
        }
        <span style={{
          fontSize: 10,
          display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          opacity: 0.8
        }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: '110%', left: 0, right: 0,
          background: 'white', borderRadius: 14, zIndex: 100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: '1px solid #f0f0f0', overflow: 'hidden'
        }}>
          <div style={{
            padding: '8px 12px 4px', fontSize: 10,
            color: '#aaa', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase'
          }}>
            Change Status
          </div>
          {flow.map(s => (
            <div
              key={s}
              onClick={() => { onUpdate(order._id, s); setOpen(false); }}
              style={{
                padding: '11px 14px', cursor: 'pointer', fontSize: 15,
                fontWeight: s === order.status ? 700 : 400,
                color: s === order.status ? statusColor(s) : '#333',
                background: s === order.status ? `${statusColor(s)}15` : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}
              onMouseEnter={e => { if (s !== order.status) e.currentTarget.style.background = '#f9f9f9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = s === order.status ? `${statusColor(s)}15` : 'white'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(s) }} />
                {s}
              </div>
              {s === order.status && <span style={{ color: statusColor(s) }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Single Order Card ─────────────────────────────────────────
const OrderCard = ({ order, onUpdate }) => {
  const isTakeAway = order.orderType === 'Take Away';
  const done       = isCompleted(order.orderType, order.status);
  const { bg, badge } = cardBg(order.orderType, order.status);
  const { secsLeft, label: timerLabel } = useCountdown(order.estimatedReadyAt, order.prepTime, order.createdAt);

  // Auto-advance is handled server-side via setTimeout in orders.js
  // Frontend just displays the countdown — no client-side status change

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Badge label in top-right box
  const badgeStatusLine = order.status === 'Processing' && order.estimatedReadyAt
    ? timerLabel
    : order.status === 'Processing'
    ? 'Ongoing'
    : order.status === 'Served' ? 'Served'
    : order.status === 'Out for Delivery' ? 'On the way'
    : order.status;

  return (
    <div style={{
      background: bg,
      borderRadius: 16,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>

      {/* ── Header white box ── */}
      <div style={{ background: 'white', borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

          {/* Left: fork icon + order number */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22, color: '#4A90D9' }}>🍴</span>
            <span style={{ fontSize: 20, fontWeight: 600 }}># {order.orderNumber}</span>
          </div>

          {/* Right: pill badge — matches screenshot UI */}
          <div style={{
            background: bg,
            borderRadius: 18,
            padding: '9px 18px',
            textAlign: 'center',
            minWidth: 115,
            boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.07)'
          }}>
            <div style={{
              fontSize: 14, fontWeight: 700,
              color: badge, letterSpacing: 0.1
            }}>
              {order.orderType}
            </div>
            {order.status === 'Processing' ? (
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: badge, marginTop: 4, opacity: 0.9
              }}>
                {timerLabel}
              </div>
            ) : (
              <div style={{
                fontSize: 11, fontWeight: 500,
                color: badge, marginTop: 4, opacity: 0.8
              }}>
                {order.status === 'Served'             ? 'Served ✓'
                 : order.status === 'Out for Delivery' ? 'On the way'
                 : order.status === 'Delivered'        ? 'Delivered ✓'
                 : order.status === 'Ready'            ? 'Ready ✓'
                 : order.status}
              </div>
            )}
          </div>
        </div>

        {/* Table + time */}
        <div style={{ fontSize: 12, color: '#888', marginTop: 10 }}>
          Table-{String(order.tableNumber || 1).padStart(2, '0')}
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>{formatTime(order.createdAt)}</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>
          {order.items?.length} Item
        </div>
      </div>

      {/* ── Items white box ── */}
      <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', flex: 1 }}>
        {order.items?.slice(0, 5).map((item, i) => (
          <div
            key={i}
            style={{
              fontSize: 15,
              fontWeight: 400,
              color: '#333',
              marginBottom: 7,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span style={{ color: '#aaa', minWidth: 20 }}>{item.quantity}x</span>
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      {/* ── Status button / dropdown ── */}
      <StatusDropdown order={order} onUpdate={onUpdate} />
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────
const OrderLine = () => {
  const [orders, setOrders]             = useState([]);
  const [notification, setNotification] = useState(null);
  const esRef     = useRef(null);
  const token     = localStorage.getItem('adminToken');
  const headers   = { Authorization: `Bearer ${token}` };
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders', { headers });
      setOrders(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 15000);
    connectSSE();
    return () => { clearInterval(iv); if (esRef.current) esRef.current.close(); };
  }, []);

  const connectSSE = () => {
    if (esRef.current) esRef.current.close();
    const es = new EventSource(
      `http://localhost:5000/api/orders/stream/admin-${adminUser.id || 'main'}`
    );
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'ORDER_RECEIVED') {
          fetchOrders();
          showNotification(`Order #${data.orderNumber} picked up by customer! 📦`);
        }
        if (data.type === 'ORDER_STATUS_CHANGED') {
          // Server auto-advanced status (Processing→Ready or Ready→Served)
          setOrders(prev => prev.map(o =>
            o._id === data.orderId.toString() ? { ...o, status: data.status } : o
          ));
          if (data.status === 'Ready') {
            showNotification(`Order #${data.orderNumber} is Ready! ✅`);
          }
          if (data.status === 'Served') {
            showNotification(`Order #${data.orderNumber} auto-marked Served 🍽️`);
          }
        }
      } catch {}
    };
    es.onerror = () => { es.close(); setTimeout(connectSSE, 5000); };
    esRef.current = es;
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const updateStatus = useCallback(async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${id}`, { status }, { headers });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } catch {}
  }, []);

  const mockOrders = [
    { _id: '1', orderNumber: 108, orderType: 'Dine In',   status: 'Processing',      tableNumber: 5, prepTime: 20, deliveryTime: 0,  estimatedReadyAt: new Date(Date.now() + 8 * 60000),  createdAt: new Date(), items: [{ name: 'Value Set Meals', quantity: 1 }, { name: 'Double Cheeseburger', quantity: 1 }, { name: 'Apple Pie', quantity: 1 }, { name: 'Coca-Cola L', quantity: 1 }] },
    { _id: '2', orderNumber: 108, orderType: 'Dine In',   status: 'Served',           tableNumber: 5, prepTime: 15, deliveryTime: 0,  estimatedReadyAt: new Date(Date.now() - 5 * 60000),  createdAt: new Date(), items: [{ name: 'Value Set Meals', quantity: 1 }, { name: 'Double Cheeseburger', quantity: 1 }, { name: 'Apple Pie', quantity: 1 }, { name: 'Coca-Cola L', quantity: 1 }] },
    { _id: '3', orderNumber: 108, orderType: 'Take Away', status: 'Processing',       tableNumber: 5, prepTime: 12, deliveryTime: 13, estimatedReadyAt: new Date(Date.now() + 5 * 60000),  createdAt: new Date(), items: [{ name: 'Value Set Meals', quantity: 1 }, { name: 'Double Cheeseburger', quantity: 1 }, { name: 'Apple Pie', quantity: 1 }, { name: 'Coca-Cola L', quantity: 1 }] },
    { _id: '4', orderNumber: 108, orderType: 'Dine In',   status: 'Processing',       tableNumber: 5, prepTime: 18, deliveryTime: 0,  estimatedReadyAt: new Date(Date.now() + 12 * 60000), createdAt: new Date(), items: [{ name: 'Value Set Meals', quantity: 1 }, { name: 'Double Cheeseburger', quantity: 1 }, { name: 'Apple Pie', quantity: 1 }, { name: 'Coca-Cola L', quantity: 1 }] },
    { _id: '5', orderNumber: 108, orderType: 'Dine In',   status: 'Processing',       tableNumber: 5, prepTime: 15, deliveryTime: 0,  estimatedReadyAt: new Date(Date.now() + 3 * 60000),  createdAt: new Date(), items: [{ name: 'Value Set Meals', quantity: 1 }, { name: 'Double Cheeseburger', quantity: 1 }, { name: 'Apple Pie', quantity: 1 }, { name: 'Coca-Cola L', quantity: 1 }] },
    { _id: '6', orderNumber: 108, orderType: 'Take Away', status: 'Delivered',        tableNumber: 5, prepTime: 12, deliveryTime: 11, estimatedReadyAt: new Date(Date.now() - 10 * 60000), createdAt: new Date(), items: [{ name: 'Value Set Meals', quantity: 1 }, { name: 'Double Cheeseburger', quantity: 1 }, { name: 'Apple Pie', quantity: 1 }, { name: 'Coca-Cola L', quantity: 1 }] },
    { _id: '7', orderNumber: 108, orderType: 'Dine In',   status: 'Served',           tableNumber: 5, prepTime: 20, deliveryTime: 0,  estimatedReadyAt: new Date(Date.now() - 8 * 60000),  createdAt: new Date(), items: [{ name: 'Value Set Meals', quantity: 1 }, { name: 'Double Cheeseburger', quantity: 1 }, { name: 'Apple Pie', quantity: 1 }, { name: 'Coca-Cola L', quantity: 1 }] },
    { _id: '8', orderNumber: 108, orderType: 'Dine In',   status: 'Processing',       tableNumber: 5, prepTime: 25, deliveryTime: 0,  estimatedReadyAt: new Date(Date.now() + 15 * 60000), createdAt: new Date(), items: [{ name: 'Value Set Meals', quantity: 1 }, { name: 'Double Cheeseburger', quantity: 1 }, { name: 'Apple Pie', quantity: 1 }, { name: 'Coca-Cola L', quantity: 1 }] },
  ];

  const displayOrders = orders.length > 0 ? orders : mockOrders;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content" style={{ paddingTop: 0 }}>

        {notification && (
          <div style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            background: '#22C55E', color: 'white', padding: '12px 24px',
            borderRadius: 30, fontSize: 14, fontWeight: 600,
            zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap'
          }}>
            {notification}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0' }}>
          <div style={{ width: 40, height: 40, background: '#6B21A8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>⭐</div>
          <h1 style={{ fontSize: 28, fontWeight: 400, color: '#333' }}>Order Line</h1>
        </div>

        <div className="page-container">
          <div className="orders-grid">
            {displayOrders.map(order => (
              <OrderCard key={order._id} order={order} onUpdate={updateStatus} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderLine;