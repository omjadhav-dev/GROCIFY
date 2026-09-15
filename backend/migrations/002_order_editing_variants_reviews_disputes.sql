-- Migration: order editing, min order qty, product variants, wholesaler
-- reviews, and the dispute/return flow.
-- Run this once against your existing database (sequelize.sync() only
-- creates new tables, never alters existing ones — see README).

-- 1. Product: minimum order quantity
ALTER TABLE products ADD COLUMN min_order_qty INT NOT NULL DEFAULT 1;

-- 2. New table: product_variants (pack sizes, e.g. 250g/500g/1kg)
CREATE TABLE product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  label VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  min_order_qty INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 3. New table: reviews (one per delivered order)
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  wholesaler_id INT NOT NULL,
  shopkeeper_id INT NOT NULL,
  shopkeeper_name VARCHAR(255),
  rating INT NOT NULL,
  comment VARCHAR(255) DEFAULT '',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- 4. Order: dispute/return flow
ALTER TABLE orders ADD COLUMN dispute_reason VARCHAR(255) DEFAULT '';
ALTER TABLE orders MODIFY COLUMN status
  ENUM('Pending','Accepted','Rejected','Dispatched','Delivered','Disputed','Returned')
  DEFAULT 'Pending';

-- 5. OrderItem: which variant (if any) was ordered
ALTER TABLE order_items ADD COLUMN variant_id INT NULL;
ALTER TABLE order_items ADD COLUMN variant_label VARCHAR(255) NULL;
