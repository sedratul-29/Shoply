// Run with: npm run seed
// Creates the first admin (from .env) and some sample products if none exist.
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');

const img = (seed) => `https://picsum.photos/seed/${seed}/640/640`;

const products = [
  { name: 'Classic Cotton T-Shirt', category: 'Clothing', price: 18.5, stock: 60, featured: true, image: img('tshirt'), description: 'Soft, breathable 100% cotton tee with a relaxed fit. Perfect for everyday wear.' },
  { name: 'Slim Fit Denim Jeans', category: 'Clothing', price: 49.99, stock: 35, featured: false, image: img('jeans'), description: 'Stretch denim jeans with a modern slim cut and durable stitching.' },
  { name: 'Waterproof Rain Jacket', category: 'Clothing', price: 79, stock: 20, featured: true, image: img('jacket'), description: 'Lightweight, packable jacket with taped seams and an adjustable hood.' },
  { name: 'Wireless Bluetooth Headphones', category: 'Electronics', price: 89.9, stock: 25, featured: true, image: img('headphones'), description: 'Over-ear headphones with active noise reduction and 30 hours of battery life.' },
  { name: 'Smart Fitness Watch', category: 'Electronics', price: 129, stock: 15, featured: true, image: img('watch'), description: 'Tracks heart rate, sleep and workouts. Water resistant with a bright AMOLED display.' },
  { name: 'Portable Power Bank 20,000mAh', category: 'Electronics', price: 34.5, stock: 50, featured: false, image: img('powerbank'), description: 'Fast-charging power bank with dual USB ports and a USB-C input.' },
  { name: 'Ceramic Coffee Mug Set (4)', category: 'Home', price: 28, stock: 40, featured: false, image: img('mugs'), description: 'Hand-glazed ceramic mugs, dishwasher and microwave safe.' },
  { name: 'Bamboo Cutting Board', category: 'Home', price: 22.75, stock: 3, featured: false, image: img('board'), description: 'Sturdy, knife-friendly bamboo board with a juice groove.' },
  { name: 'LED Desk Lamp', category: 'Home', price: 39, stock: 30, featured: true, image: img('lamp'), description: 'Adjustable desk lamp with three colour modes and touch dimming.' },
  { name: 'Yoga Mat (6mm)', category: 'Sports', price: 25, stock: 45, featured: false, image: img('yogamat'), description: 'Non-slip, cushioned mat that rolls up easily for travel.' },
  { name: 'Insulated Steel Water Bottle', category: 'Sports', price: 19.9, stock: 80, featured: false, image: img('bottle'), description: 'Keeps drinks cold for 24 hours or hot for 12. BPA free.' },
  { name: 'Running Shoes', category: 'Sports', price: 94, stock: 18, featured: true, image: img('shoes'), description: 'Cushioned, breathable running shoes built for daily training.' },
];

async function run() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123';

  if (!(await User.exists({ email }))) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Store Admin',
      email,
      password,
      role: 'admin',
    });
    console.log(`Admin created: ${email}  (change the password after first login)`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany(products);
    console.log(`Inserted ${products.length} sample products`);
  } else {
    console.log('Products already exist, skipping sample products');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
