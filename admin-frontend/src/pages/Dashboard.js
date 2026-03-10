import React, { useState, useEffect } from "react";
import { ComposedChart, Bar, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Sidebar from "../components/Sidebar";
import axios from "axios";

const DAYS = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];




const ChevronDown = ({ isOpen }) => (
  <svg
    width="28" height="28" viewBox="0 0 28 28" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.25s ease',
      flexShrink: 0
    }}
  >
    <circle cx="14" cy="14" r="14" fill="#EFEFEF" />
    <path
      d="M9 12L14 17L19 12"
      stroke="#AAAAAA"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [orderSummaryPeriod, setOrderSummaryPeriod] = useState("Daily");
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState("Daily");
  const [showRevenueDropdown, setShowRevenueDropdown] = useState(false);

  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  const filterOptions = ["All", "Today", "This Week", "This Month"];
  const periodOptions = ["Daily", "Weekly", "Monthly"];

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowFilterDropdown(false);
      setShowOrderDropdown(false);
      setShowRevenueDropdown(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        axios.get("/api/analytics", { headers }),
        axios.get("/api/orders", { headers }),
      ]);
      setAnalytics(analyticsRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    }
  };

  const filterOrders = (ordersList) => {
    const now = new Date();
    if (filterPeriod === "Today") {
      return ordersList.filter(
        (o) => new Date(o.createdAt).toDateString() === now.toDateString(),
      );
    } else if (filterPeriod === "This Week") {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      return ordersList.filter((o) => new Date(o.createdAt) >= weekAgo);
    } else if (filterPeriod === "This Month") {
      return ordersList.filter((o) => {
        const d = new Date(o.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    }
    return ordersList;
  };

  const filteredOrders = filterOrders(orders);
  const served = filteredOrders.filter(
    (o) => o.status === "Served" || o.status === "Done",
  ).length;
  const dineIn = filteredOrders.filter((o) => o.orderType === "Dine In").length;
  const takeAway = filteredOrders.filter(
    (o) => o.orderType === "Take Away",
  ).length;
  const total = served + dineIn + takeAway || 1;
  const takeAwayPct = Math.round((takeAway / total) * 100);
  const servedPct = Math.round((served / total) * 100);
  const dineInPct = Math.round((dineIn / total) * 100);

  const donutData = [
    { name: "Take Away", value: takeAway || 1, color: "#555" },
    { name: "Served", value: served || 1, color: "#888" },
    { name: "Dine In", value: dineIn || 1, color: "#222" },
  ];

  const getRevenueData = () => {
    if (revenuePeriod === "Weekly") {
      return ["Wk1", "Wk2", "Wk3", "Wk4"].map((week, i) => ({
        day: week,
        revenue: [4200, 6800, 5100, 9200][i],
      }));
    } else if (revenuePeriod === "Monthly") {
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => ({
        day: month,
        revenue: [18000, 22000, 19000, 31000, 27000, 35000][i],
      }));
    }
    return DAYS.map((day, i) => ({
      day,
      revenue:
        analytics?.weeklyRevenue?.find((w) => w._id === i + 2)?.revenue ||
        [800, 1200, 950, 1800, 2200, 3100, 1500][i],
    }));
  };

  const tables =
    analytics?.tables ||
    Array.from({ length: 30 }, (_, i) => ({
      tableNumber: i + 1,
      status: [4, 5, 7, 9, 12, 17, 21, 22, 26, 28, 29, 30].includes(i + 1)
        ? "reserved"
        : "available",
    }));

  const totalRevenue = analytics?.totalRevenue || 0;
  const revenueDisplay =
    totalRevenue >= 1000 ? Math.round(totalRevenue / 1000) + "K" : totalRevenue;

  const chefMap = {};
  orders.forEach((o) => {
    if (o.chefName) chefMap[o.chefName] = (chefMap[o.chefName] || 0) + 1;
  });
  const chefStats =
    Object.keys(chefMap).length > 0
      ? Object.entries(chefMap).map(([name, count]) => ({
          name,
          orders: count,
        }))
      : [
          { name: "Manesh", orders: 3 },
          { name: "Pritam", orders: 7 },
          { name: "Yash", orders: 5 },
          { name: "Tenzen", orders: 8 },
        ];

  const dropdownStyle = {
    position: "absolute",
    background: "white",
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    zIndex: 200,
    minWidth: 150,
    overflow: "hidden",
  };

  const dropdownItemStyle = (isActive) => ({
    padding: "11px 16px",
    cursor: "pointer",
    fontSize: 13,
    background: isActive ? "#f5f5f5" : "white",
    fontWeight: isActive ? 600 : 400,
  });

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        {/* Top Filter Bar */}
        <div className="topbar" style={{ position: "relative" }}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowFilterDropdown(!showFilterDropdown);
              setShowOrderDropdown(false);
              setShowRevenueDropdown(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "white",
              border: "1.5px solid #E8E8E8",
              borderRadius: 30,
              padding: "10px 20px",
              width: 280,
              cursor: "pointer",
              boxShadow: showFilterDropdown
                ? "0 0 0 3px rgba(0,0,0,0.06)"
                : "0 1px 4px rgba(0,0,0,0.06)",
              transition: "box-shadow 0.2s",
            }}
          >
            {/* Search icon */}
            <span style={{ fontSize: 15, color: "#bbb" }}>🔍</span>

            <span
              style={{
                flex: 1,
                fontSize: 14,
                color: filterPeriod === "All" ? "#bbb" : "#333",
                fontWeight: filterPeriod === "All" ? 400 : 500,
              }}
            >
              {filterPeriod === "All" ? "Filter by period..." : filterPeriod}
            </span>

            {/* Clear button */}
            {filterPeriod !== "All" && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterPeriod("All");
                }}
                style={{
                  fontSize: 13,
                  color: "#bbb",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ✕
              </span>
            )}

           <ChevronDown isOpen={showFilterDropdown} />
          </div>

          {/* Dropdown */}
          {showFilterDropdown && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: 52,
                left: 0,
                background: "white",
                borderRadius: 16,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                zIndex: 200,
                minWidth: 280,
                overflow: "hidden",
                border: "1px solid #f0f0f0",
              }}
            >
              {/* Dropdown header */}
              <div
                style={{
                  padding: "12px 16px 8px",
                  fontSize: 11,
                  color: "#aaa",
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                Filter by Period
              </div>

              {filterOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => {
                    setFilterPeriod(opt);
                    setShowFilterDropdown(false);
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f9f9f9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      filterPeriod === opt ? "#f4f4f4" : "white")
                  }
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    fontSize: 14,
                    background: filterPeriod === opt ? "#f4f4f4" : "white",
                    fontWeight: filterPeriod === opt ? 600 : 400,
                    color: filterPeriod === opt ? "#1a1a1a" : "#555",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "background 0.15s",
                  }}
                >
                  <span>{opt}</span>
                  {filterPeriod === opt && (
                    <span style={{ color: "#22C55E", fontSize: 16 }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="page-container">
          <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 20 }}>
            Analytics
          </h2>

          {/* Stats Row */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🍽️</div>
              <div>
                <div className="stat-value">0{chefStats.length}</div>
                <div className="stat-label">Total Chef</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">₹</div>
              <div>
                <div className="stat-value">{revenueDisplay}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div>
                <div className="stat-value">
                  {analytics?.totalOrders || orders.length || 0}
                </div>
                <div className="stat-label">Total Orders</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div>
                <div className="stat-value">{analytics?.totalClients || 0}</div>
                <div className="stat-label">Total Clients</div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-row">
            {/* Order Summary */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div>
                  <div className="chart-title">Order Summary</div>
                  <div className="chart-subtitle" style={{ fontSize: 9 }}>
                    hijokplrngntop[gtgkoikokyhikoy[phokphnoy
                  </div>
                </div>
                <div style={{ position: "relative" }}>
                  <button
                    className="daily-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOrderDropdown(!showOrderDropdown);
                      setShowFilterDropdown(false);
                      setShowRevenueDropdown(false);
                    }}
                  >
                    {orderSummaryPeriod}
                    <ChevronDown isOpen={showOrderDropdown} />
                  </button>
                  {showOrderDropdown && (
                    <div
                      style={{ ...dropdownStyle, top: 36, right: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {periodOptions.map((opt) => (
                        <div
                          key={opt}
                          style={dropdownItemStyle(orderSummaryPeriod === opt)}
                          onClick={() => {
                            setOrderSummaryPeriod(opt);
                            setShowOrderDropdown(false);
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f5f5f5")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              orderSummaryPeriod === opt ? "#f5f5f5" : "white")
                          }
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3 stat boxes */}
              <div className="order-stats-row">
                <div className="order-stat-box">
                  <div className="order-stat-num">
                    {String(served).padStart(2, "0")}
                  </div>
                  <div className="order-stat-label">Served</div>
                </div>
                <div className="order-stat-box">
                  <div className="order-stat-num">
                    {String(dineIn).padStart(2, "0")}
                  </div>
                  <div className="order-stat-label">Dine In</div>
                </div>
                <div className="order-stat-box">
                  <div className="order-stat-num">
                    {String(takeAway).padStart(2, "0")}
                  </div>
                  <div className="order-stat-label">Take Away</div>
                </div>
              </div>

              {/* Donut + Legend */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                <PieChart width={100} height={100}>
                  <Pie
                    data={donutData}
                    cx={45}
                    cy={45}
                    innerRadius={28}
                    outerRadius={45}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#f5f5f5"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div style={{ flex: 1, fontSize: 12, color: "#555" }}>
                  {[
                    { label: "Take Away", pct: takeAwayPct, color: "#555" },
                    { label: "Served", pct: servedPct, color: "#888" },
                    { label: "Dine in", pct: dineInPct, color: "#222" },
                  ].map((d, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ width: 62, color: "#666" }}>
                        {d.label}
                      </span>
                      <span style={{ width: 38, color: "#999" }}>
                        ({d.pct}%)
                      </span>
                      <div
                        style={{
                          flex: 1,
                          background: "#e8e8e8",
                          borderRadius: 4,
                          height: 6,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${d.pct}%`,
                            background: d.color,
                            height: "100%",
                            borderRadius: 4,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div
              className="chart-card"
              style={{ padding: 0, overflow: "hidden" }}
            >
              <div
                style={{
                  padding: "16px 20px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    className="chart-title"
                    style={{ fontSize: 18, fontWeight: 600 }}
                  >
                    Revenue
                  </div>
                  <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>
                    hijokplrngntop[gtgkoikokyhikoy[phokphnoy
                  </div>
                </div>
                <div style={{ position: "relative" }}>
                  <button
                    className="daily-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRevenueDropdown(!showRevenueDropdown);
                      setShowFilterDropdown(false);
                      setShowOrderDropdown(false);
                    }}
                  >
                    {revenuePeriod}
                   <ChevronDown isOpen={showRevenueDropdown}  />
                  </button>
                  {showRevenueDropdown && (
                    <div
                      style={{ ...dropdownStyle, top: 42, right: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {periodOptions.map((opt) => (
                        <div
                          key={opt}
                          style={dropdownItemStyle(revenuePeriod === opt)}
                          onClick={() => {
                            setRevenuePeriod(opt);
                            setShowRevenueDropdown(false);
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#f5f5f5")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              revenuePeriod === opt ? "#f5f5f5" : "white")
                          }
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chart area — white rounded box */}
              <div
                style={{
                  margin: "0 12px 12px",
                  background: "white",
                  borderRadius: 14,
                  padding: "12px 4px 4px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
               <ResponsiveContainer width="100%" height={180}>
  <ComposedChart data={getRevenueData()} barSize={38}>
    <XAxis
      dataKey="day"
      tick={{ fontSize: 11, fill: '#aaa' }}
      axisLine={false}
      tickLine={false}
    />
    <Tooltip
      contentStyle={{
        borderRadius: 10,
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontSize: 12
      }}
      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
    />
    <Bar dataKey="revenue" fill="#E8E8E8" radius={[6, 6, 0, 0]} />
    <Line
      type="monotone"
      dataKey="revenue"
      stroke="#1a1a1a"
      strokeWidth={2.5}
      dot={false}
    />
  </ComposedChart>
</ResponsiveContainer>
              </div>
            </div>

            {/* Tables */}
            <div
              className="chart-card"
              style={{ padding: 0, overflow: "hidden" }}
            >
              {/* Header */}
              <div style={{ padding: "16px 20px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    className="chart-title"
                    style={{ fontSize: 18, fontWeight: 600 }}
                  >
                    Tables
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      fontSize: 12,
                      color: "#555",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#22C55E",
                          display: "inline-block",
                        }}
                      />
                      Reserved
                    </span>
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#E8E8E8",
                          border: "1px solid #ccc",
                          display: "inline-block",
                        }}
                      />
                      Available
                    </span>
                  </div>
                </div>
                <div
                  style={{ height: 1, background: "#F0F0F0", marginTop: 12 }}
                />
              </div>

              {/* Tables grid */}
              <div style={{ padding: "8px 12px 14px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 6,
                  }}
                >
                  {(tables.length > 0
                    ? tables
                    : Array.from({ length: 30 }, (_, i) => ({
                        tableNumber: i + 1,
                        status: [
                          4, 5, 7, 9, 12, 17, 21, 22, 26, 28, 29, 30,
                        ].includes(i + 1)
                          ? "reserved"
                          : "available",
                      }))
                  ).map((t) => {
                    const isRes = t.status === "reserved";
                    return (
                      <div
                        key={t.tableNumber}
                        style={{
                          background: isRes ? "#22C55E" : "white",
                          border: `1px solid ${isRes ? "#16A34A" : "#E0E0E0"}`,
                          borderRadius: 8,
                          padding: "6px 4px",
                          textAlign: "center",
                          cursor: "default",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 8,
                            color: isRes ? "rgba(255,255,255,0.85)" : "#888",
                            fontWeight: 500,
                          }}
                        >
                          Table
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: isRes ? "white" : "#1a1a1a",
                            lineHeight: 1.2,
                          }}
                        >
                          {String(t.tableNumber).padStart(2, "0")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Chef Table */}
          <table className="data-table">
            <thead>
              <tr>
                <th>Chef Name</th>
                <th>Order Taken</th>
              </tr>
            </thead>
            <tbody>
              {chefStats.map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td>{String(c.orders).padStart(2, "0")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
