CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date TEXT,
  location TEXT,
  price DECIMAL(10,2),
  link TEXT UNIQUE NOT NULL,
  origin_platform TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);