const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, maxlength: 60, index: true },
    image: { type: String, trim: true, default: '' },
    stock: { type: Number, required: true, min: 0, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
