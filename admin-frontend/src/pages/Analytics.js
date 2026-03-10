import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    axios.get('/api/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setAnalytics(r.data)).catch(() => {});
  }, []);

  const revenueData = ['Mon','Tue','Wed','Thur','Fri','Sat','Sun'].map((day, i) => ({
    day,
    revenue: analytics?.weeklyRevenue?.find(w => w._id === i + 2)?.revenue || [800,1200,950,1800,2200,3100,1500][i]
  }));

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="filter-dropdown">Filter... <span>⌄</span></div>
        </div>
        <div className="page-container">
          <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 20 }}>Analytics Overview</h2>

          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon">📦</div><div><div className="stat-value">{analytics?.totalOrders || 0}</div><div className="stat-label">Total Orders</div></div></div>
            <div className="stat-card"><div className="stat-icon">₹</div><div><div className="stat-value">{analytics ? (analytics.totalRevenue >= 1000 ? Math.round(analytics.totalRevenue/1000)+'K' : analytics.totalRevenue) : '0'}</div><div className="stat-label">Total Revenue</div></div></div>
            <div className="stat-card"><div className="stat-icon">👥</div><div><div className="stat-value">{analytics?.totalClients || 0}</div><div className="stat-label">Total Clients</div></div></div>
            <div className="stat-card"><div className="stat-icon">🪑</div><div><div className="stat-value">{analytics?.totalTables || 0}</div><div className="stat-label">Total Tables</div></div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-title">Weekly Revenue</div>
                <button className="daily-btn">Weekly ⌄</button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#E0E0E0" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: 16 }}>Order Types</div>
              <PieChart width={200} height={200}>
                <Pie data={[
                  { name: 'Dine In', value: analytics?.dineIn || 40 },
                  { name: 'Take Away', value: analytics?.takeAway || 30 },
                  { name: 'Served', value: analytics?.served || 30 }
                ]} cx={90} cy={90} innerRadius={50} outerRadius={80} dataKey="value">
                  {['#333', '#22C55E', '#6B21A8'].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
              </PieChart>
              <div style={{ fontSize: 12, color: '#555' }}>
                {[{label:'Dine In',val:analytics?.dineIn||40,c:'#333'},{label:'Take Away',val:analytics?.takeAway||30,c:'#22C55E'},{label:'Served',val:analytics?.served||30,c:'#6B21A8'}].map((d,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <div style={{ width:10,height:10,background:d.c,borderRadius:'50%' }} />
                    <span>{d.label}: {d.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
