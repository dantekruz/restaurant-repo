import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">⭐</div>
      <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Dashboard">
        ▦
      </NavLink>
      <NavLink to="/tables" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Tables">
        🪑
      </NavLink>
      <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Orders">
        📋
      </NavLink>
      <NavLink to="/menu" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Menu">
        🍽️
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Analytics">
        📊
      </NavLink>
      <div className="sidebar-avatar" onClick={logout} title="Logout">A</div>
    </div>
  );
};

export default Sidebar;
