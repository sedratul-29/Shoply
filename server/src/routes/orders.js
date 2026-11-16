const express = require('express');
const { z } = require('zod');

const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { round2, OBJECT_ID_RE } = require('../utils/helpers');
const { validate, validateId } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const FREE_SHIPPING_OVER = 100;
const SHIPPING_FEE = 8;
const TAX_RATE = 0.05;

const createSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().regex(OBJECT_ID_RE, 'Invalid product id'),
        qty: z.number().int().min(1).max(20),
      })
    )
    .min(1, 'Your cart is empty')
    .max(50),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(5).max(25),
    address: z.string().trim().min(3).max(200),
    city: z.string().trim().min(2).max(80),
    postalCode: z.string().trim().min(2).max(20),
    country: z.string().trim().min(2).max(80),
  }),
  paymentMethod: z.enum(['cod']).default('cod'),
});

async function restock(items) {
  await Promise.all(
    items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty } }))
  );
}

// Create an order. Prices and totals are ALWAYS computed on the server from the
// database, never trusted from the client.
router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { shippingAddress, paymentMethod } = req.body;

    // Merge duplicate lines of the same product
    const wanted = new Map();
    for (const { productId, qty } of req.body.items) {
      wanted.set(productId, (wanted.get(productId) || 0) + qty);
    }

    const reserved = []; // lines whose stock we already decremented
    const orderItems = [];

    try {
      for (const [productId, qty] of wanted) {
        // Atomic: only decrements when enough stock exists
        const product = await Product.findOneAndUpdate(
          { _id: productId, isActive: true, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { new: true }
        );
        if (!product) {
          throw new AppError('One or more items are unavailable or out of stock', 409);
        }
        reserved.push({ product: product._id, qty });
        orderItems.push({
          product: product._id,
          name: product.name,
          image: product.image,
          price: product.price,
          qty,
        });
      }

      const itemsPrice = round2(orderItems.reduce((sum, i) => sum + i.price * i.qty, 0));
      const shippingPrice = itemsPrice >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
      const taxPrice = round2(itemsPrice * TAX_RATE);
      const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

      const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
      });

      res.status(201).json({ order });
    } catch (err) {
      await restock(reserved); // put stock back if anything failed
      throw err;
    }
  })
);

router.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ orders });
  })
);

router.get(
  '/:id',
  validateId(),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email').lean();
    if (!order) throw new AppError('Order not found', 404);

    const isOwner = order.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      // 404 instead of 403 so we do not reveal that the order exists
      throw new AppError('Order not found', 404);
    }
    res.json({ order });
  })
);

// Customers can cancel their own order while it is still pending
router.put(
  '/:id/cancel',
  validateId(),
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'pending') {
      throw new AppError('Only pending orders can be cancelled', 400);
    }
    order.status = 'cancelled';
    await order.save();
    await restock(order.items);
    res.json({ order });
  })
);

module.exports = router;
