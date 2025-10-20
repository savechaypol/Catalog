const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const form = $('#form');
const idEl = $('#id');
const categoryEl = $('#category');
const nameEl = $('#name');
const brandEl = $('#brand');
const modelEl = $('#model');
const priceEl = $('#price');
const tableBody = $('#table tbody');
const clearBtn = $('#clear');

async function fetchCategories() {
  const res = await fetch('/api/categories');
  return res.json();
}
async function fetchProducts() {
  const res = await fetch('/api/products');
  return res.json();
}
async function createProduct(payload) {
  const res = await fetch('/api/products', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('สร้างไม่สำเร็จ');
  return res.json();
}
async function updateProduct(id, payload) {
  const res = await fetch('/api/products/' + id, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('แก้ไขไม่สำเร็จ');
  return res.json();
}
async function deleteProduct(id) {
  const res = await fetch('/api/products/' + id, { method: 'DELETE' });
  if (!res.ok) throw new Error('ลบไม่สำเร็จ');
  return res.json();
}

function fmtPrice(v) {
  try { return Number(v).toLocaleString('th-TH', { style: 'currency', currency: 'THB' }); }
  catch { return v; }
}

function fillForm(p) {
  idEl.value = p?.id || '';
  categoryEl.value = p?.category || '';
  nameEl.value = p?.name || '';
  brandEl.value = p?.brand || '';
  modelEl.value = p?.model || '';
  priceEl.value = p?.price ?? '';
}

function renderTable(items) {
  tableBody.innerHTML = items.map(p => `
    <tr>
      <td>${p.category || '-'}</td>
      <td>${p.name || '-'}</td>
      <td>${p.brand || '-'}</td>
      <td>${p.model || '-'}</td>
      <td>${fmtPrice(p.price)}</td>
      <td>
        <div class="table-actions">
          <button class="ghost" data-edit="${p.id}">แก้ไข</button>
          <button class="danger" data-del="${p.id}">ลบ</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function refresh() {
  renderTable(await fetchProducts());
}

async function init() {
  // load categories
  const cats = await fetchCategories();
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    categoryEl.appendChild(opt);
  });

  await refresh();

  // form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      category: categoryEl.value,
      name: nameEl.value.trim(),
      brand: brandEl.value.trim(),
      model: modelEl.value.trim(),
      price: Number(priceEl.value || 0)
    };
    try {
      if (idEl.value) {
        await updateProduct(idEl.value, payload);
      } else {
        await createProduct(payload);
      }
      fillForm(null);
      await refresh();
      alert('บันทึกสำเร็จ');
    } catch (err) {
      alert(err.message || 'ผิดพลาด');
    }
  });

  // clear
  clearBtn.addEventListener('click', () => fillForm(null));

  // table actions
  tableBody.addEventListener('click', async (e) => {
    const editId = e.target.getAttribute('data-edit');
    const delId  = e.target.getAttribute('data-del');
    if (editId) {
      const all = await fetchProducts();
      const p = all.find(x => x.id === editId);
      if (p) fillForm(p);
    } else if (delId) {
      if (confirm('ยืนยันการลบรายการนี้?')) {
        try {
          await deleteProduct(delId);
          await refresh();
        } catch (err) {
          alert('ลบไม่สำเร็จ');
        }
      }
    }
  });
}

init();
