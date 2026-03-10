# 🍽️ Restaurant Management System — MERN Stack

## Project Structure

```
restaurant-app/
├── backend/              ← Node.js + Express + MongoDB
├── admin-frontend/       ← React (Admin Dashboard) — Port 3000
└── user-frontend/        ← React (User Order App) — Port 3001
```

---

## ⚙️ Setup Instructions

### 1. Backend

```bash
cd backend
npm install
```

Create `.env` file (copy from `.env.example`):
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/restaurant
JWT_SECRET=your_secret_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=5000
```

> ⚠️ For Gmail OTP: Enable 2FA → Generate App Password → use that as EMAIL_PASS

```bash
npm run dev     # development
npm start       # production
```

---

### 2. Admin Frontend

```bash
cd admin-frontend
npm install
npm start       # runs on http://localhost:3000
```

**First Admin Account:** Register via API or directly create in MongoDB:
```json
{ "role": "admin" }
```

Or use this seed script in backend:
```bash
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./models/User');
  await User.create({ name: 'Admin', email: 'admin@restaurant.com', password: await bcrypt.hash('admin123', 10), role: 'admin' });
  console.log('Admin created!');
  process.exit();
});
"
```

---

### 3. User Frontend

```bash
cd user-frontend
npm install
npm start       # runs on http://localhost:3001
```

---

## 📱 Pages

### Admin Side
| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Admin login with OTP forgot password |
| Dashboard | `/dashboard` | Analytics, charts, chef table |
| Tables | `/tables` | Add/delete tables with chair count |
| Order Line | `/orders` | Live order cards (Processing/Done) |
| Menu | `/menu` | Add new dishes with image upload |
| Analytics | `/analytics` | Revenue & order charts |

### User Side
| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User login |
| Register | `/register` | User signup |
| Forgot Password | `/forgot-password` | Email OTP reset |
| Home | `/home` | Browse menu by category |
| Cart | `/cart` | Order items, Dine In/Take Away, bill |
| Orders | `/orders` | Order history & status |

---

## 🛠️ Tech Stack
- **Frontend:** React JS + Vanilla CSS (NO Tailwind, NO UI libraries)
- **Backend:** Node.js + Express.js
- **Database:** MongoDB Atlas
- **Auth:** JWT + bcrypt
- **Email:** Nodemailer (Gmail)
- **Charts:** Recharts
- **File Upload:** Multer
