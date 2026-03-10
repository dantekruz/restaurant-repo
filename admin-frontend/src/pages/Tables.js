import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTable, setNewTable] = useState({ name: "", chairs: "03" });
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchTables(); }, []);

  const fetchTables = async () => {
    try {
      const res = await axios.get(`${API}/api/tables`, { headers });
      // Guard: always set an array
      setTables(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTables([]);
    }
  };

  const createTable = async () => {
    const tableNumber = tables.length > 0 ? Math.max(...tables.map(t => t.tableNumber)) + 1 : 1;
    try {
      await axios.post(`${API}/api/tables`, {
        tableNumber,
        name: newTable.name || `Table ${tableNumber}`,
        chairs: parseInt(newTable.chairs),
      }, { headers });
      setShowAdd(false);
      setNewTable({ name: "", chairs: "03" });
      fetchTables();
    } catch {}
  };

  const deleteTable = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete this table?")) {
      try {
        await axios.delete(`${API}/api/tables/${id}`, { headers });
        fetchTables();
      } catch {}
    }
  };

  const toggleStatus = async (table) => {
    const newStatus = table.status === "reserved" ? "available" : "reserved";
    try {
      await axios.put(`${API}/api/tables/${table._id}`, { status: newStatus }, { headers });
      setTables(prev =>
        Array.isArray(prev)
          ? prev.map(t => t._id === table._id ? { ...t, status: newStatus } : t)
          : []
      );
    } catch {}
  };

  const nextNum = tables.length > 0 ? Math.max(...tables.map(t => t.tableNumber)) + 1 : 1;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-container">
          <h2 className="page-title">Tables</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
            {tables.map(table => {
              const isReserved = table.status === "reserved";
              return (
                <div
                  key={table._id}
                  onClick={() => toggleStatus(table)}
                  style={{ background: isReserved ? "#22C55E" : "#F0F0F0", border: `1.5px solid ${isReserved ? "#16A34A" : "#CCCCCC"}`, borderRadius: 16, minHeight: 110, width: "100%", position: "relative", cursor: "pointer", transition: "all 0.25s ease", boxShadow: isReserved ? "0 2px 10px rgba(34,197,94,0.25)" : "0 1px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "8px 10px 8px 10px", userSelect: "none", boxSizing: "border-box" }}
                >
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={(e) => deleteTable(e, table._id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 21C6.45 21 5.97933 20.8043 5.588 20.413C5.19667 20.0217 5.00067 19.5507 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.8043 20.021 18.413 20.413C18.0217 20.805 17.5507 21.0007 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z" fill={isReserved ? "rgba(255,255,255,0.85)" : "#333"} />
                      </svg>
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: isReserved ? "rgba(255,255,255,0.9)" : "#222", letterSpacing: 0.2, lineHeight: 1.3 }}>Table</span>
                    <span style={{ fontSize: 34, fontWeight: 900, color: isReserved ? "#fff" : "#111", lineHeight: 1.1, letterSpacing: "-1px" }}>
                      {String(table.tableNumber).padStart(2, "0")}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, fontSize: 11, color: isReserved ? "rgba(255,255,255,0.75)" : "#888", fontWeight: 500 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.8125 1.75V7.19162C4.76788 7.20344 4.71494 7.2205 4.67556 7.23231C4.46381 7.2975 4.31681 7.36575 4.21094 7.4375C4.16175 7.46928 4.11587 7.50593 4.074 7.54688C4.03988 7.58275 3.99219 7.65625 3.99219 7.65625L3.9375 7.75206V8.75H4.375V12.25H5.25V8.75H8.75V12.25H9.625V8.75H10.0625V7.75206L10.0078 7.65625C10.0078 7.65625 9.95969 7.58275 9.92556 7.54688C9.88383 7.50595 9.8381 7.46931 9.78906 7.4375C9.68319 7.36575 9.53619 7.2975 9.324 7.23231C9.28463 7.2205 9.23212 7.20344 9.1875 7.19162V1.75H8.3125V2.1875H5.6875V1.75H4.8125ZM5.6875 3.0625H6.5625V7.01356C6.23088 7.02231 5.93338 7.03106 5.6875 7.05469V3.0625ZM7.4375 3.0625H8.3125V7.05469C8.06619 7.03062 7.76912 7.02231 7.4375 7.01356V3.0625Z" fill="black" />
                    </svg>
                    <span>{String(table.chairs).padStart(2, "0")}</span>
                  </div>
                </div>
              );
            })}

            {/* Add New Table Card */}
            <div
              onClick={() => setShowAdd(!showAdd)}
              style={{ border: "2px dashed #D0D0D0", borderRadius: 12, minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", color: "#bbb", fontSize: 28, transition: "border-color 0.2s", background: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#999"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#D0D0D0"}
            >
              +
              {showAdd && (
                <div onClick={e => e.stopPropagation()} style={{ position: "absolute", left: "110%", background: "white", borderRadius: 16, padding: "18px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", zIndex: 50, width: 210, border: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Table name (optional)</div>
                  <input
                    style={{ width: "100%", border: "none", borderBottom: "1.5px solid #E0E0E0", padding: "4px 0 8px", fontSize: 24, fontWeight: 700, textAlign: "center", outline: "none", marginBottom: 14, color: "#1a1a1a" }}
                    value={newTable.name || nextNum}
                    onChange={e => setNewTable({ ...newTable, name: e.target.value })}
                    placeholder={String(nextNum)}
                  />
                  <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>Chair</div>
                  <select
                    style={{ border: "1px solid #E0E0E0", borderRadius: 8, padding: "6px 10px", fontSize: 14, marginBottom: 14, outline: "none", color: "#333", background: "white", cursor: "pointer" }}
                    value={newTable.chairs}
                    onChange={e => setNewTable({ ...newTable, chairs: e.target.value })}
                  >
                    {["01","02","03","04","05","06","07","08"].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button
                    onClick={createTable}
                    style={{ width: "100%", background: "#1E1E2D", color: "white", border: "none", borderRadius: 10, padding: "12px", cursor: "pointer", fontSize: 15, fontWeight: 600, transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#2d2d45"}
                    onMouseLeave={e => e.currentTarget.style.background = "#1E1E2D"}
                  >
                    Create
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginTop: 20, fontSize: 13, color: "#666", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: "white", border: "1px solid #E0E0E0" }} />Available
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: "#22C55E" }} />Reserved
            </div>
            <div style={{ marginLeft: "auto", fontSize: 12, color: "#aaa" }}>Click a table to toggle its status</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tables;