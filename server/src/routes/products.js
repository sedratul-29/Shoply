const express = require('express');
const { z } = require('zod');

const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex } = require('../utils/helpers');
const { validate, validateId } = require('../middleware/validate');

const router = express.Router();

const listQuery = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name: { name: 1 },
};

router.get(
  '/',
  validate(listQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { q, category, minPrice, maxPrice, featured, sort, page, limit } = req.query;

    const filter = { isActive: true };
    if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };
    if (category) filter.category = category;
    if (featured) filter.featured = featured === 'true';
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(SORTS[sort])
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await Product.distinct('category', { isActive: true });
    res.json({ categories: categories.sort() });
  })
);

router.get(
  '/:id',
  validateId(),
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, isActive: true }).lean();
    if (!product) throw new AppError('Product not found', 404);
    res.json({ product });
  })
);

module.exports = router;
