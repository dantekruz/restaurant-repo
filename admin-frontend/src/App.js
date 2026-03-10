import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import OrderLine from './pages/OrderLine';
import Menu from './pages/Menu';
import Analytics from './pages/Analytics';
import './styles/global.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tables" element={<Tables />} />
              <Route path="/orders" element={<OrderLine />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
