import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const CATEGORIES = ['Burger', 'Pizza', 'Drink', 'French fries', 'Veggies'];

const Menu = () => {
  const [form, setForm] = useState({ name: '', description: '', price: '', avgPrepTime: '', category: 'Pizza' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const token = localStorage.getItem('adminToken');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchMenu(); }, []);

  const fetchMenu = async () => {
    const res = await axios.get('/api/menu');
    setMenuItems(res.data);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', avgPrepTime: '', category: 'Pizza' });
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      avgPrepTime: item.avgPrepTime || '',
      category: item.category
    });
    setImagePreview(item.image ? `http://localhost:5000${item.image}` : null);
    setImageFile(null);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.price || !form.category) {
      setError('Name, price and category are required');
      return;
    }
    const data = new FormData();
    Object.keys(form).forEach(k => data.append(k, form[k]));
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingId) {
        await axios.put(`/api/menu/${editingId}`, data, { headers });
        setSuccess('Item updated successfully!');
      } else {
        await axios.post('/api/menu', data, { headers });
        setSuccess('Item added successfully!');
      }
      resetForm();
      fetchMenu();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item');
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Delete this item?')) {
      await axios.delete(`/api/menu/${id}`, { headers });
      if (editingId === id) resetForm();
      fetchMenu();
    }
  };

  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(i => i.category === activeCategory);

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="filter-dropdown">Filter... <span>⌄</span></div>
        </div>

        <div className="menu-layout">
          {/* LEFT — Form */}
          <div className="menu-form">

            {/* Edit mode banner */}
            {editingId && (
              <div style={{
                background: '#EEF2FF',
                border: '1px solid #C7D2FE',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13
              }}>
                <span style={{ color: '#4338CA', fontWeight: 600 }}>✏️ Editing: {form.name}</span>
                <button
                  onClick={resetForm}
                  style={{
                    background: 'none', border: 'none',
                    color: '#6366F1', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600
                  }}
                >
                  Cancel Edit ✕
                </button>
              </div>
            )}

            {/* Image upload */}
            <label htmlFor="img-upload" style={{
              width: 120, height: 100,
              border: `2px ${editingId ? 'solid #6366F1' : 'solid #E0E0E0'}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginBottom: 24,
              overflow: 'hidden',
              position: 'relative',
              background: '#fafafa'
            }}>
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 36, color: '#ccc' }}>🖼️</span>
              }
              {imagePreview && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', opacity: 0,
                  transition: 'opacity 0.2s',
                  color: 'white', fontSize: 12, fontWeight: 600
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  Change
                </div>
              )}
            </label>
            <input id="img-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />

            {/* Form fields */}
            <div className="form-group">
              <label className="form-label">name</label>
              <input className="form-input" placeholder="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">description</label>
              <input className="form-input" placeholder="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">price</label>
              <input className="form-input" placeholder="price" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">average prep time</label>
              <input className="form-input" placeholder="time in minutes" type="number" value={form.avgPrepTime} onChange={e => setForm({ ...form, avgPrepTime: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">category</label>
              <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {error   && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">{success}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-add-dish"
                onClick={handleSubmit}
                style={{
                  background: editingId ? '#4338CA' : '#1E1E2D',
                  flex: 1
                }}
              >
                {editingId ? '💾 Save Changes' : 'Add New Dish'}
              </button>
              {editingId && (
                <button
                  onClick={resetForm}
                  style={{
                    background: 'white',
                    color: '#666',
                    border: '1px solid #E0E0E0',
                    borderRadius: 8,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* RIGHT — Preview + Items List */}
          <div className="menu-preview-panel">

            {/* Live Preview */}
            <div className="preview-item-card">
              <div className="preview-item-img">
                {imagePreview
                  ? <img src={imagePreview} alt="prev" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🖼️'
                }
              </div>
              <div>
                <div className="preview-item-title">{form.name || 'Title'}</div>
                <div className="preview-item-desc">{form.description || 'Description'}</div>
                {form.price && <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginTop: 4 }}>₹{form.price}</div>}
              </div>
            </div>

            <button
              className="btn-add-item"
              onClick={handleSubmit}
              style={{ background: editingId ? '#4338CA' : '#D32F2F', marginBottom: 16 }}
            >
              {editingId ? '💾 Save Changes' : 'Add Item'}
            </button>

            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {['All', ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    border: '1px solid #ddd',
                    background: activeCategory === cat ? '#1E1E2D' : 'white',
                    color: activeCategory === cat ? 'white' : '#555',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontWeight: activeCategory === cat ? 600 : 400,
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items List */}
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {filteredItems.length === 0 && (
                <div style={{ textAlign: 'center', color: '#bbb', padding: 20, fontSize: 13 }}>
                  No items yet
                </div>
              )}
              {filteredItems.map(item => (
                <div
                  key={item._id}
                  style={{
                    background: editingId === item._id ? '#EEF2FF' : 'white',
                    border: `1px solid ${editingId === item._id ? '#C7D2FE' : '#eee'}`,
                    borderRadius: 10,
                    padding: '10px 12px',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Item image */}
                  <div style={{ width: 42, height: 42, background: '#eee', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    {item.image && (
                      <img
                        src={`http://localhost:5000${item.image}`}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>

                  {/* Item info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>₹{item.price} · {item.category}</div>
                  </div>

                  {/* Edit + Delete buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => handleEdit(item)}
                      style={{
                        background: editingId === item._id ? '#6366F1' : '#F0F0F0',
                        border: 'none',
                        borderRadius: 8,
                        width: 30, height: 30,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        transition: 'background 0.2s'
                      }}
                      title="Edit item"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteItem(item._id)}
                      style={{
                        background: '#FEE2E2',
                        border: 'none',
                        borderRadius: 8,
                        width: 30, height: 30,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        transition: 'background 0.2s'
                      }}
                      title="Delete item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;