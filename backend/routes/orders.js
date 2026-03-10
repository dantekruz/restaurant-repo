const express  = require('express');
const router   = express.Router();
const Order    = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table    = require('../models/Table');
const { auth, adminAuth } = require('../middleware/auth');

// ── SSE helpers ──────────────────────────────────────────────────
if (!global.sseClients)   global.sseClients   = {};
if (!global.orderTimers)  global.orderTimers   = {};   // orderId → timeoutId

const pushSSE = (clientId, payload) => {
  try {
    const client = global.sseClients?.[clientId];
    if (client) client.write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch {}
};

const pushToAllAdmins = (payload) => {
  Object.keys(global.sseClients)
    .filter(k => k.startsWith('admin-'))
    .forEach(k => pushSSE(k, payload));
};

// ── Schedule auto-advance timer on the server ────────────────────
// When prepTime countdown finishes → set status to 'Ready' automatically
// Also handles Dine In auto-Served timer based on table occupancy
const scheduleAutoAdvance = async (order) => {
  const id = order._id.toString();

  // Clear any existing timer for this order
  if (global.orderTimers[id]) {
    clearTimeout(global.orderTimers[id]);
    delete global.orderTimers[id];
  }

  if (order.status !== 'Processing') return;
  if (!order.estimatedReadyAt) return;

  const msUntilReady = new Date(order.estimatedReadyAt) - Date.now();
  if (msUntilReady <= 0) return; // already past — do not auto-fire

  global.orderTimers[id] = setTimeout(async () => {
    try {
      delete global.orderTimers[id];

      const fresh = await Order.findById(id);
      if (!fresh || fresh.status !== 'Processing') return; // admin already changed it

      fresh.status = 'Ready';
      await fresh.save();

      // Notify user
      if (fresh.user) {
        pushSSE(fresh.user.toString(), {
          type: 'ORDER_UPDATED', orderId: fresh._id,
          status: 'Ready', orderNumber: fresh.orderNumber, orderType: fresh.orderType
        });
      }
      // Notify admins
      pushToAllAdmins({ type: 'ORDER_STATUS_CHANGED', orderId: fresh._id, status: 'Ready', orderNumber: fresh.orderNumber });

      // For Dine In: schedule auto-Served based on table occupancy
      if (fresh.orderType === 'Dine In') {
        await scheduleServedTimer(fresh);
      }
    } catch (e) { console.error('Auto-advance error:', e); }
  }, msUntilReady);
};

// Auto-mark Served for Dine In based on reserved table %
const scheduleServedTimer = async (order) => {
  try {
    const allTables      = await Table.find();
    const reservedCount  = allTables.filter(t => t.status === 'reserved').length;
    const total          = allTables.length || 1;
    const pct            = (reservedCount / total) * 100;

    // < 50% reserved → 2 min, 50–80% → 4 min, > 80% → 5 min
    let serveMinutes;
    if (pct < 50)       serveMinutes = 2;
    else if (pct < 80)  serveMinutes = 4;
    else                serveMinutes = 5;

    const serveMs = serveMinutes * 60 * 1000;
    const sid     = `serve_${order._id.toString()}`;

    if (global.orderTimers[sid]) clearTimeout(global.orderTimers[sid]);

    global.orderTimers[sid] = setTimeout(async () => {
      try {
        delete global.orderTimers[sid];
        const fresh = await Order.findById(order._id);
        if (!fresh || fresh.status !== 'Ready') return;

        fresh.status = 'Served';
        await fresh.save();

        if (fresh.user) {
          pushSSE(fresh.user.toString(), {
            type: 'ORDER_UPDATED', orderId: fresh._id,
            status: 'Served', orderNumber: fresh.orderNumber, orderType: fresh.orderType
          });
        }
        pushToAllAdmins({ type: 'ORDER_STATUS_CHANGED', orderId: fresh._id, status: 'Served', orderNumber: fresh.orderNumber });
      } catch (e) { console.error('Auto-serve error:', e); }
    }, serveMs);

  } catch (e) { console.error('scheduleServedTimer error:', e); }
};

// ── SSE stream ──────────────────────────────────────────────────
router.get('/stream/:userId', (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  global.sseClients[req.params.userId] = res;

  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    delete global.sseClients[req.params.userId];
  });
});

// ── Get all orders (admin) ──────────────────────────────────────
router.get('/', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get user's own orders ───────────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Place order (user) ──────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { items, orderType, tableNumber, address } = req.body;

    // Calculate average prep time:
    // 1. Try avgPrepTime sent directly from client (most reliable)
    // 2. Fallback: look up MenuItem in DB
    // 3. Final fallback: 15 min
    let totalPrepTime = 0, count = 0;
    for (const item of items) {
      // Client may send avgPrepTime directly on each item
      const clientPrepTime = Number(item.avgPrepTime);
      if (clientPrepTime > 0) {
        totalPrepTime += clientPrepTime;
        count++;
      } else if (item.menuItem) {
        // Fallback: look up in DB
        try {
          const mi = await MenuItem.findById(item.menuItem).select('avgPrepTime');
          if (mi?.avgPrepTime && Number(mi.avgPrepTime) > 0) {
            totalPrepTime += Number(mi.avgPrepTime);
            count++;
          }
        } catch {}
      }
    }
    // Use avg of all items, fallback to 15 min
    const prepTime = count > 0 ? Math.round(totalPrepTime / count) : 15;
    console.log('[Order] prepTime calculated:', prepTime, 'min | count:', count, '| total:', totalPrepTime);

    // delivery time: random 10–15 min for Take Away
    const deliveryTime = orderType === 'Take Away'
      ? Math.floor(Math.random() * 6) + 10 : 0;

    const now            = new Date();
    // estimatedReadyAt = NOW + prepTime minutes (strictly in future)
    const estimatedReadyAt = new Date(now.getTime() + prepTime * 60 * 1000);

    const itemTotal      = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const taxes          = Math.round(itemTotal * 0.025);
    const deliveryCharge = req.body.deliveryCharge ?? (orderType === 'Take Away' ? 50 : 0);
    const grandTotal     = itemTotal + taxes + deliveryCharge;

    const order = await Order.create({
      user: req.user.id,
      userName: req.body.userName, userPhone: req.body.userPhone,
      items, orderType, tableNumber, address,
      itemTotal, taxes, deliveryCharge, grandTotal,
      prepTime, deliveryTime, estimatedReadyAt
    });

    // Schedule backend auto-advance
    await scheduleAutoAdvance(order);

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── User marks as Received — MUST be before /:id ───────────────
router.put('/received/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    const reqUserId   = req.user.id?.toString() || req.user._id?.toString();
    if (orderUserId !== reqUserId)
      return res.status(403).json({ message: 'Not authorized' });

    order.status = 'Received';
    await order.save();

    // Cancel any pending timers for this order
    const sid = `serve_${order._id.toString()}`;
    if (global.orderTimers[sid]) { clearTimeout(global.orderTimers[sid]); delete global.orderTimers[sid]; }

    pushToAllAdmins({ type: 'ORDER_RECEIVED', orderId: order._id, orderNumber: order.orderNumber });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin updates order status — MUST be after /received/:id ───
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Cancel auto-advance timer if admin manually changed status away from Processing
    const id  = order._id.toString();
    const sid = `serve_${id}`;
    if (req.body.status && req.body.status !== 'Processing') {
      if (global.orderTimers[id])  { clearTimeout(global.orderTimers[id]);  delete global.orderTimers[id]; }
    }
    // If admin manually set to Ready for Dine In, schedule auto-Served
    if (req.body.status === 'Ready' && order.orderType === 'Dine In') {
      await scheduleServedTimer(order);
    }
    // Cancel serve timer if admin manually advanced past Ready
    if (req.body.status && !['Processing', 'Ready'].includes(req.body.status)) {
      if (global.orderTimers[sid]) { clearTimeout(global.orderTimers[sid]); delete global.orderTimers[sid]; }
    }

    if (order.user) {
      pushSSE(order.user.toString(), {
        type: 'ORDER_UPDATED', orderId: order._id,
        status: order.status, orderNumber: order.orderNumber, orderType: order.orderType
      });
    }
    pushToAllAdmins({ type: 'ORDER_STATUS_CHANGED', orderId: order._id, status: order.status, orderNumber: order.orderNumber });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;