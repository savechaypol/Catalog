const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const categorySel = $('#category');
const searchInput = $('#search');
const clearBtn = $('#clear');
const listBox = $('#list');

async function fetchCategories() {
  const res = await fetch('/api/categories');
  return res.json();
}

async function fetchProducts({ q = '', category = '' } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  const res = await fetch('/api/products?' + params.toString());
  return res.json();
}

function fmtPrice(v) {
  try { return Number(v).toLocaleString('th-TH', { style: 'currency', currency: 'THB' }); }
  catch { return v; }
}

function renderList(items) {
  listBox.innerHTML = items.map(p => `
    <tr>
      <td>${p.category || '-'}</td>
      <td>${p.name || '-'}</td>
      <td>${p.brand || '-'}</td>
      <td>${p.model || '-'}</td>
      <td>${fmtPrice(p.price)}</td>
    </tr>
  `).join('');
}

async function init() {
  // fill categories
  const cats = await fetchCategories();
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    categorySel.appendChild(opt);
  });

  // initial products
  renderList(await fetchProducts());

  // listeners (debounce search)
  let t;
  function applyFilter() {
    const q = searchInput.value.trim();
    const category = categorySel.value;
    fetchProducts({ q, category }).then(renderList);
  }
  searchInput.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(applyFilter, 200);
  });
  categorySel.addEventListener('change', applyFilter);
  clearBtn.addEventListener('click', () => {
    searchInput.value = ''; categorySel.value = '';
    applyFilter();
  });
}
/**/ 

init();


