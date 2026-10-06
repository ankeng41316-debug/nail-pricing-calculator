const STORAGE_KEY = 'nail-pricing-calculator-v1';

const defaultCounts = {
  jumpColor: 0,
  art: 0,
  diamond: 0,
  mirror: 0,
  extend50: 0,
  extend100: 0,
  repair: 0,
  removeHome: 0,
  removeOther: 0,
};

let counts = { ...defaultCounts };
let customItems = [];
let coupon = { code: '', type: '', value: 0 };

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
  couponInput: document.getElementById('couponInput'),
  applyCouponBtn: document.getElementById('applyCouponBtn'),
  couponStatus: document.getElementById('couponStatus'),
};

function formatCurrency(value) {
  return `NT$ ${value.toLocaleString()}`;
}

function getCouponDiscount(subtotal) {
  if (!coupon || !coupon.type) return { amount: 0, label: '未套用優惠券' };

  if (coupon.type === 'amount') {
    const amount = Math.min(coupon.value, subtotal);
    return { amount, label: `優惠券折扣：- ${formatCurrency(amount)}` };
  }

  if (coupon.type === 'percent') {
    const amount = Math.round(subtotal * (coupon.value / 100));
    return { amount, label: `優惠券折扣 (${coupon.value}%)：- ${formatCurrency(amount)}` };
  }

  return { amount: 0, label: '未套用優惠券' };
}

function saveState() {
  const data = {
    counts,
    customItems,
    coupon,
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
    if (data.coupon) {
      coupon = data.coupon;
      el.couponInput.value = coupon.code || '';
      if (coupon.code) {
        if (coupon.type === 'percent') {
          el.couponStatus.textContent = `已套用：${coupon.code} (${coupon.value}% 折扣)`;
        } else {
          el.couponStatus.textContent = `已套用：${coupon.code}`;
        }
      } else {
        el.couponStatus.textContent = '未套用優惠券';
      }
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

function parseCoupon(raw) {
  const value = raw.trim();
  if (!value) {
    coupon = { code: '', type: '', value: 0 };
    el.couponStatus.textContent = '未套用優惠券';
    return true;
  }

  // 檢查百分比格式：10% 或 10
  if (value.endsWith('%')) {
    const percent = Number(value.replace('%', ''));
    if (percent > 0 && percent <= 100) {
      coupon = { code: value, type: 'percent', value: percent };
      el.couponStatus.textContent = `已套用：${value} 折扣`;
      return true;
    }
  }

  // 檢查數字格式（折扣金額）
  if (/^\d+$/.test(value)) {
    const discount = Number(value);
    if (discount >= 0) {
      coupon = { code: value, type: 'amount', value: discount };
      el.couponStatus.textContent = `已套用：折扣 ${formatCurrency(discount)}`;
      return true;
    }
  }

  alert('優惠券格式錯誤，請輸入：\n• 金額：100\n• 百分比：10%');
  coupon = { code: '', type: '', value: 0 };
  el.couponStatus.textContent = '未套用優惠券';
  return false;
}

function applyCoupon() {
  parseCoupon(el.couponInput.value || '');
  calculateTotal();
}

function calculateTotal() {
  const basePrice = getBasePrice();

  let subtotal = basePrice;
  subtotal += counts.jumpColor * 40;
  subtotal += counts.art * 50;
  subtotal += counts.diamond * 50;
  subtotal += counts.mirror * 50;
  subtotal += counts.extend50 * 50;
  subtotal += counts.extend100 * 100;
  subtotal += counts.repair * 50;
  subtotal += counts.removeHome * 100;
  subtotal += counts.removeOther * 150;

  customItems.forEach((item) => {
    subtotal += item.price * item.count;
  });

  const discountInfo = getCouponDiscount(subtotal);
  const discountAmount = discountInfo.amount;
  const total = Math.max(0, subtotal - discountAmount);

  const detailLines = [
    `基礎款式：${formatCurrency(basePrice)}`,
  ];

  if (counts.jumpColor > 0) {
    detailLines.push(`跳色：${counts.jumpColor} × 40 = ${formatCurrency(counts.jumpColor * 40)}`);
  }
  if (counts.art > 0) {
    detailLines.push(`手繪：${counts.art} × 50 = ${formatCurrency(counts.art * 50)}`);
  }
  if (counts.diamond > 0) {
    detailLines.push(`貼鑽：${counts.diamond} × 50 = ${formatCurrency(counts.diamond * 50)}`);
  }
  if (counts.mirror > 0) {
    detailLines.push(`鏡面：${counts.mirror} × 50 = ${formatCurrency(counts.mirror * 50)}`);
  }
  if (counts.extend50 > 0) {
    detailLines.push(`延甲 50元/隻：${counts.extend50} × 50 = ${formatCurrency(counts.extend50 * 50)}`);
  }
  if (counts.extend100 > 0) {
    detailLines.push(`延甲 100元/隻：${counts.extend100} × 100 = ${formatCurrency(counts.extend100 * 100)}`);
  }
  if (counts.repair > 0) {
    detailLines.push(`修補：${counts.repair} × 50 = ${formatCurrency(counts.repair * 50)}`);
  }
  if (counts.removeHome > 0) {
    detailLines.push(`卸甲 本店：${counts.removeHome} × 100 = ${formatCurrency(counts.removeHome * 100)}`);
  }
  if (counts.removeOther > 0) {
    detailLines.push(`卸甲 他店：${counts.removeOther} × 150 = ${formatCurrency(counts.removeOther * 150)}`);
  }

  if (customItems.length > 0) {
    customItems.forEach((item) => {
      detailLines.push(`${item.name}：${item.count} × ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.count)}`);
    });
  }

  if (discountAmount > 0) {
    detailLines.push(discountInfo.label);
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
  coupon = { code: '', type: '', value: 0 };
  el.couponInput.value = '';
  el.couponStatus.textContent = '未套用優惠券';
  updateCounterUI();
  renderCustomItems();

  const defaultBase = document.querySelector('input[name="base"][value="400"]');
  if (defaultBase) defaultBase.checked = true;

  calculateTotal();
}

function shareQuote() {
  const baseName = document.querySelector('input[name="base"]:checked')?.parentElement?.querySelector('strong')?.textContent || '基礎款式';
  const summaryText = `巧鹹美甲報價\n${baseName}：${el.totalPrice.textContent}\n${el.summaryDetail.textContent.replace(/\s+/g, ' ').trim()}`;

  if (navigator.share) {
    navigator.share({
      title: '巧鹹美甲報價',
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
el.applyCouponBtn.addEventListener('click', applyCoupon);
el.couponInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') applyCoupon();
});
el.resetBtn.addEventListener('click', resetCalculator);
el.printBtn.addEventListener('click', () => window.print());
el.shareBtn.addEventListener('click', shareQuote);

loadState();
updateCounterUI();
renderCustomItems();
if (!el.couponStatus.textContent) {
  el.couponStatus.textContent = '未套用優惠券';
}
calculateTotal();
