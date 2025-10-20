const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const app = express(); // ✅ สำคัญมาก อย่าลืมประกาศ app
const PORT = process.env.PORT || 3000;

const __dirnameResolved = __dirname || path.resolve();
const DATA_DIR = path.join(__dirnameResolved, 'data');
const DATA_PATH = path.join(DATA_DIR, 'products.json');

const DEFAULT_CATEGORIES = ['ไฟฟ้า', 'เครื่องกล', 'โยธา'];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirnameResolved, 'public')));

// สร้างไฟล์/โฟลเดอร์ data หากยังไม่มี
async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DATA_PATH);
    } catch {
      const seed = [
        {
          id: uuidv4(),
          category: 'ไฟฟ้า',
          name: 'ตู้ไฟ MDB 400A',
          brand: 'FVC',
          model: 'MDB-400A',
          price: 185000
        },
        {
          id: uuidv4(),
          category: 'เครื่องกล',
          name: 'ปั๊มน้ำหอยโข่ง 5HP',
          brand: 'Mitsubishi',
          model: 'ECO-5HP',
          price: 42000
        },
        {
          id: uuidv4(),
          category: 'โยธา',
          name: 'คอนกรีตผสมเสร็จ 240 KSC',
          brand: 'CPAC',
          model: 'CP240',
          price: 1900
        }
      ];
      await fs.writeFile(DATA_PATH, JSON.stringify(seed, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Init data file error:', e);
  }
}

async function readProducts() {
  const buf = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(buf);
}

async function writeProducts(products) {
  await fs.writeFile(DATA_PATH, JSON.stringify(products, null, 2), 'utf-8');
}

// ===== API =====

// หมวดหมู่
app.get('/api/categories', (req, res) => {
  res.json(DEFAULT_CATEGORIES);
});

// อ่านสินค้า + รองรับ ?q=keyword&category=หมวด
app.get('/api/products', async (req, res) => {
  try {
    const { q = '', category = '' } = req.query;
    let products = await readProducts();

    const qn = String(q).trim().toLowerCase();
    const cat = String(category).trim();

    if (cat) {
      products = products.filter(p => p.category === cat);
    }
    if (qn) {
      products = products.filter(p =>
        (p.name || '').toLowerCase().includes(qn) ||
        (p.brand || '').toLowerCase().includes(qn) ||
        (p.model || '').toLowerCase().includes(qn)
      );
    }
    res.json(products);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'อ่านข้อมูลล้มเหลว' });
  }
});

// เพิ่มสินค้า
app.post('/api/products', async (req, res) => {
  try {
    const { category, name, brand, model, price } = req.body;
    if (!category || !name) {
      return res.status(400).json({ error: 'กรอก category และ name' });
    }
    const products = await readProducts();
    const newItem = {
      id: uuidv4(),
      category,
      name,
      brand: brand || '',
      model: model || '',
      price: Number(price) || 0
    };
    products.push(newItem);
    await writeProducts(products);
    res.status(201).json(newItem);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'เพิ่มสินค้าล้มเหลว' });
  }
});

// แก้ไขสินค้า
app.put('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { category, name, brand, model, price } = req.body;
    const products = await readProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'ไม่พบสินค้า' });
    }
    const updated = {
      ...products[idx],
      category: category ?? products[idx].category,
      name: name ?? products[idx].name,
      brand: brand ?? products[idx].brand,
      model: model ?? products[idx].model,
      price: price !== undefined ? Number(price) : products[idx].price
    };
    products[idx] = updated;
    await writeProducts(products);
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'แก้ไขสินค้าล้มเหลว' });
  }
});

// (เสริม) ลบสินค้า
app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const products = await readProducts();
    const next = products.filter(p => p.id !== id);
    if (next.length === products.length) {
      return res.status(404).json({ error: 'ไม่พบสินค้า' });
    }
    await writeProducts(next);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'ลบสินค้าล้มเหลว' });
  }
});

// เสิร์ฟหน้าเว็บ
app.get('/admin', (_, res) => {
  res.sendFile(path.join(__dirnameResolved, 'public', 'admin.html'));
});

ensureDataFile().then(() => {
  app.listen(PORT, () => {
    console.log(`FVC catalog running at http://localhost:${PORT}`);
  });
});
