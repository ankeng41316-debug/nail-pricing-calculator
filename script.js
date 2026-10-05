const STORAGE_KEY = 'nail-pricing-calculator-v1';

const defaultCounts = {
  jumpColor: 0,
  art: 0,
  diamond: 0,
  mirror: 0,
  extendHome: 0,
  extendOther: 0,
};

let counts = { ...defaultCounts };
let customItems = [];

const el = {
  totalPrice: document.getElementById('totalPrice'),
  summaryDetail: document.getElementById('summaryDetail'),
  customItemsContainer: document.getElementById('customItemsContainer'),
  customName: document.getElementById('customName'),
  customPrice: document.getElementById('customPrice'),
  resetBtn: document.getElementById('resetBtn'),
  addCustomBtn: document.getElementById('addCustomBtn'),
  printBtn: document.getElementById('printBtn'),
  shareBtn: document.getElementById('shareBtn'),
};

function formatCurrency(value) {
  return `NT$ ${value.toLocaleString()}`;
}

function saveState() {
  const data = {
    counts,
    customItems,
    selectedBase: document.querySelector('input[name="base"]:checked')?.value || '400',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (data.counts) {
      Object.keys(defaultCounts).forEach((key) => {
        counts[key] = Number(data.counts[key]) || 0;
      });
    }
    if (Array.isArray(data.customItems)) {
      customItems = data.customItems;
    }

    const baseRadio = document.querySelector(`input[name="base"][value="${data.selectedBase || '400'}"]`);
    if (baseRadio) {
      baseRadio.checked = true;
    }
  } catch (error) {
    console.error('讀取儲存資料失敗', error);
  }
}

function updateCounterUI() {
  Object.keys(counts).forEach((key) => {
    const node = document.getElementById(key);
    if (node) node.textContent = counts[key];
  });
}

function getBasePrice() {
  const checked = document.querySelector('input[name="base"]:checked');
  return Number(checked ? checked.value : 400);
}

function calculateTotal() {
  const basePrice = getBasePrice();

  let total = basePrice;
  total += counts.jumpColor * 40;
  total += counts.art * 50;
  total += counts.diamond * 50;
  total += counts.mirror * 50;
  total += counts.extendHome * 100;
  total += counts.extendOther * 150;

  customItems.forEach((item) => {
    total += item.price * item.count;
  });

  const detailLines = [
    `基礎款式：${formatCurrency(basePrice)}`,
    `跳色：${counts.jumpColor} × 40 = ${formatCurrency(counts.jumpColor * 40)}`,
    `手繪：${counts.art} × 50 = ${formatCurrency(counts.art * 50)}`,
    `貼鑽：${counts.diamond} × 50 = ${formatCurrency(counts.diamond * 50)}`,
    `鏡面：${counts.mirror} × 50 = ${formatCurrency(counts.mirror * 50)}`,
    `本店延甲：${counts.extendHome} × 100 = ${formatCurrency(counts.extendHome * 100)}`,
    `他店延甲：${counts.extendOther} × 150 = ${formatCurrency(counts.extendOther * 150)}`,
  ];

  if (customItems.length > 0) {
    customItems.forEach((item) => {
      detailLines.push(`${item.name}：${item.count} × ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.count)}`);
    });
  }

  el.totalPrice.textContent = formatCurrency(total);
  el.summaryDetail.innerHTML = detailLines
    .map((line) => `<div class="line"><span>${line}</span></div>`)
    .join('');

  saveState();
}

function renderCustomItems() {
  el.customItemsContainer.innerHTML = '';

  customItems.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'custom-item';

    row.innerHTML = `
      <div class="custom-item-name">
        <strong>${item.name}</strong>
        <span>${formatCurrency(item.price)} / 件</span>
      </div>
      <div class="custom-item-actions">
        <button type="button" class="count-btn" data-custom-id="${item.id}" data-step="-1">-</button>
        <span class="count-value">${item.count}</span>
        <button type="button" class="count-btn" data-custom-id="${item.id}" data-step="1">+</button>
        <button type="button" class="delete-btn" data-custom-id="${item.id}" aria-label="刪除">🗑</button>
      </div>
    `;

    el.customItemsContainer.appendChild(row);
  });

  const customButtons = document.querySelectorAll('[data-custom-id]');
  customButtons.forEach((button) => {
    const id = Number(button.dataset.customId);
    const step = Number(button.dataset.step || 0);

    if (button.classList.contains('delete-btn')) {
      button.addEventListener('click', () => removeCustomItem(id));
      return;
    }

    button.addEventListener('click', () => updateCustomItemCount(id, step));
  });
}

function addCustomItem() {
  const name = el.customName.value.trim();
  const price = Number(el.customPrice.value);

  if (!name || Number.isNaN(price) || price < 0) {
    alert('請輸入正確的項目名稱與金額！');
    return;
  }

  customItems.push({
    id: Date.now(),
    name,
    price,
    count: 1,
  });

  el.customName.value = '';
  el.customPrice.value = '';
  renderCustomItems();
  calculateTotal();
}

function removeCustomItem(id) {
  customItems = customItems.filter((item) => item.id !== id);
  renderCustomItems();
  calculateTotal();
}

function updateCustomItemCount(id, step) {
  const item = customItems.find((entry) => entry.id === id);
  if (!item) return;

  item.count = Math.max(0, item.count + step);
  if (item.count === 0) {
    removeCustomItem(id);
    return;
  }

  renderCustomItems();
  calculateTotal();
}

function updateCount(key, step) {
  counts[key] = Math.max(0, (counts[key] || 0) + step);
  updateCounterUI();
  calculateTotal();
}

function resetCalculator() {
  counts = { ...defaultCounts };
  customItems = [];
  updateCounterUI();
  renderCustomItems();

  const defaultBase = document.querySelector('input[name="base"][value="400"]');
  if (defaultBase) defaultBase.checked = true;

  calculateTotal();
}

function shareQuote() {
  const baseName = document.querySelector('input[name="base"]:checked')?.parentElement?.querySelector('strong')?.textContent || '基礎款式';
  const summaryText = `美甲美睫報價\n${baseName}：${el.totalPrice.textContent}\n${el.summaryDetail.textContent.replace(/\s+/g, ' ').trim()}`;

  if (navigator.share) {
    navigator.share({
      title: '美甲美睫報價',
      text: summaryText,
    }).catch(() => {});
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(summaryText)
      .then(() => alert('報價內容已複製到剪貼簿'))
      .catch(() => alert('瀏覽器不支援自動複製，請手動複製內容'));
  } else {
    alert('目前瀏覽器不支援分享功能，請使用列印功能。');
  }
}

document.querySelectorAll('[data-key]').forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.key;
    const step = Number(button.dataset.step || 0);
    updateCount(key, step);
  });
});

document.querySelectorAll('input[name="base"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('.option-card').forEach((card) => {
      card.classList.toggle('selected', card.querySelector('input').checked);
    });
    calculateTotal();
  });
});

el.addCustomBtn.addEventListener('click', addCustomItem);
el.customName.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') addCustomItem();
});
el.customPrice.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') addCustomItem();
});
el.resetBtn.addEventListener('click', resetCalculator);
el.printBtn.addEventListener('click', () => window.print());
el.shareBtn.addEventListener('click', shareQuote);

loadState();
updateCounterUI();
renderCustomItems();
calculateTotal();
