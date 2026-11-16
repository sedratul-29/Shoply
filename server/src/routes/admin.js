const express = require('express');
const { z } = require('zod');

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex } = require('../utils/helpers');
const { validate, validateId } = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Every route below requires a logged-in ADMIN. Enforced here on the server;
// hiding links in the UI is only cosmetic.
router.use(protect, restrictTo('admin'));

const pageQuery = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/* ------------------------------ Dashboard ------------------------------ */

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const [users, products, orders, revenueAgg, byStatus, daily, lowStock, recentOrders] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Order.aggregate([
          { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              revenue: { $sum: '$totalPrice' },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Product.find({ stock: { $lte: 5 } })
          .sort({ stock: 1 })
          .limit(6)
          .select('name stock')
          .lean(),
        Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name').lean(),
      ]);

    res.json({
      counts: { users, products, orders },
      revenue: revenueAgg[0] ? revenueAgg[0].total : 0,
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      daily,
      lowStock,
      recentOrders,
    });
  })
);

/* ------------------------------- Products ------------------------------ */

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(2000),
  price: z.number().min(0).max(1_000_000),
  category: z.string().trim().min(2).max(60),
  image: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//i.test(v), 'Image must be an http(s) URL')
    .default(''),
  stock: z.number().int().min(0).max(1_000_000),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

router.get(
  '/products',
  validate(pageQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { q, page, limit } = req.query;
    const filter = q ? { name: { $regex: escapeRegex(q), $options: 'i' } } : {};
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    res.json({ products, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.get(
  '/products/:id',
  validateId(),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).lean();
    if (!product) throw new AppError('Product not found', 404);
    res.json({ product });
  })
);

router.post(
  '/products',
  validate(productSchema),
  asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);
    res.status(201).json({ product });
  })
);

router.put(
  '/products/:id',
  validateId(),
  validate(productSchema),
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) throw new AppError('Product not found', 404);
    res.json({ product });
  })
);

router.delete(
  '/products/:id',
  validateId(),
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new AppError('Product not found', 404);
    res.json({ message: 'Product deleted' });
  })
);

/* -------------------------------- Orders ------------------------------- */

const statusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
});

router.get(
  '/orders',
  validate(pageQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { status, page, limit } = req.query;
    const filter = status ? { status } : {};
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'name email')
        .lean(),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.put(
  '/orders/:id/status',
  validateId(),
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError('Order not found', 404);

    const next = req.body.status;
    if (order.status === 'cancelled' && next !== 'cancelled') {
      throw new AppError('A cancelled order cannot be reopened', 400);
    }

    if (next === 'cancelled' && order.status !== 'cancelled') {
      await Promise.all(
        order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } }))
      );
    }

    if (next === 'delivered' && !order.isPaid) {
      order.isPaid = true; // cash on delivery is paid when delivered
      order.paidAt = new Date();
    }

    order.status = next;
    await order.save();
    res.json({ order });
  })
);

/* -------------------------------- Users -------------------------------- */

const userUpdateSchema = z
  .object({
    role: z.enum(['user', 'admin']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.isActive !== undefined, 'Nothing to update');

router.get(
  '/users',
  validate(pageQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { q, page, limit } = req.query;
    const filter = q
      ? {
          $or: [
            { name: { $regex: escapeRegex(q), $options: 'i' } },
            { email: { $regex: escapeRegex(q), $options: 'i' } },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ users, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.put(
  '/users/:id',
  validateId(),
  validate(userUpdateSchema),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user._id.toString()) {
      throw new AppError('You cannot change your own role or status', 400);
    }
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    if (req.body.role !== undefined) user.role = req.body.role;
    if (req.body.isActive !== undefined) {
      user.isActive = req.body.isActive;
      if (!req.body.isActive) user.tokenVersion += 1; // kick them out immediately
    }
    await user.save();
    res.json({ user });
  })
);

module.exports = router;
