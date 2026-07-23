const MENU_PATH = '../menu.json';
const WEB3_ENDPOINT = 'https://api.web3forms.com/submit';

const orderForm = document.querySelector('#order-form');
const orderItemsHost = document.querySelector('#order-items');
const addOrderItemBtn = document.querySelector('#add-order-item');
const submitOrderBtn = document.querySelector('#submit-order');
const orderStatus = document.querySelector('#order-status');
const orderMessageInput = document.querySelector('#order-message');

let menuOptions = [];

function setFooterYear() {
  const yearNode = document.querySelector('#year');
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildMenuOptions(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.menu)) {
    return [];
  }

  return raw.menu.flatMap((group) => {
    if (!group || typeof group !== 'object' || typeof group.group !== 'string' || !Array.isArray(group.items)) {
      return [];
    }

    return group.items
      .filter((item) => item && typeof item === 'object' && typeof item.name === 'string' && item.name.trim() !== '')
      .map((item) => ({
        value: `${slugify(group.group)}::${slugify(item.name)}`,
        label: `${item.name.trim()} (${group.group.trim()})`,
        itemName: item.name.trim(),
        groupName: group.group.trim()
      }));
  });
}

async function loadMenu() {
  try {
    const response = await fetch(MENU_PATH, { cache: 'no-store' });
    if (!response.ok) return [];

    const data = await response.json();
    return buildMenuOptions(data);
  } catch {
    return [];
  }
}

function getItemTemplate(index) {
  const optionHtml = menuOptions
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join('');

  return `
    <article class="order-item-row" data-order-item>
      <div class="order-item-grid">
        <label>
          Menu Item
          <select name="order_item_${index}" required>
            <option value="" selected disabled>Select an item</option>
            ${optionHtml}
          </select>
        </label>

        <label>
          Quantity
          <input type="number" name="order_qty_${index}" min="1" step="1" value="1" required />
        </label>

        <label>
          Item Notes
          <input type="text" name="order_note_${index}" placeholder="Sugar level, ice, drizzle, etc." />
        </label>

        <button type="button" class="remove-item-btn" data-remove-item>Remove</button>
      </div>
    </article>
  `;
}

function refreshItemNames() {
  const rows = orderItemsHost.querySelectorAll('[data-order-item]');
  rows.forEach((row, idx) => {
    const rowIndex = idx + 1;
    const itemSelect = row.querySelector('select');
    const qtyInput = row.querySelector('input[type="number"]');
    const noteInput = row.querySelector('input[type="text"]');

    if (itemSelect) itemSelect.name = `order_item_${rowIndex}`;
    if (qtyInput) qtyInput.name = `order_qty_${rowIndex}`;
    if (noteInput) noteInput.name = `order_note_${rowIndex}`;
  });
}

function addOrderItem() {
  if (!orderItemsHost || menuOptions.length === 0) return;

  const nextIndex = orderItemsHost.querySelectorAll('[data-order-item]').length + 1;
  orderItemsHost.insertAdjacentHTML('beforeend', getItemTemplate(nextIndex));
}

function findOptionByValue(value) {
  return menuOptions.find((option) => option.value === value);
}

function collectOrderItems() {
  const rows = orderItemsHost.querySelectorAll('[data-order-item]');
  const items = [];

  rows.forEach((row) => {
    const itemSelect = row.querySelector('select');
    const qtyInput = row.querySelector('input[type="number"]');
    const noteInput = row.querySelector('input[type="text"]');

    const selectedValue = itemSelect ? itemSelect.value : '';
    const qty = qtyInput ? Number(qtyInput.value) : 0;
    const notes = noteInput ? noteInput.value.trim() : '';

    if (!selectedValue || !Number.isFinite(qty) || qty < 1) {
      return;
    }

    const option = findOptionByValue(selectedValue);
    if (!option) return;

    items.push({
      itemName: option.itemName,
      groupName: option.groupName,
      quantity: qty,
      notes
    });
  });

  return items;
}

function buildOrderMessage(formData, orderItems) {
  const customerName = String(formData.get('customer_name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const pickupDate = String(formData.get('pickup_date') || '').trim();
  const pickupTime = String(formData.get('pickup_time') || '').trim();
  const generalNotes = String(formData.get('general_notes') || '').trim();

  const orderLines = orderItems.map((item, idx) => {
    const notePart = item.notes ? ` | Notes: ${item.notes}` : '';
    return `${idx + 1}. ${item.itemName} (${item.groupName}) | Qty: ${item.quantity}${notePart}`;
  });

  return [
    `Customer Name: ${customerName}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Pickup Date: ${pickupDate}`,
    `Pickup Time: ${pickupTime}`,
    '',
    'Order Items:',
    ...orderLines,
    '',
    `General Notes: ${generalNotes || 'None'}`
  ].join('\n');
}

function setStatus(message, tone) {
  if (!orderStatus) return;
  orderStatus.textContent = message;
  orderStatus.classList.remove('is-error', 'is-success', 'is-neutral');
  orderStatus.classList.add(tone);
}

function getCaptchaResponse() {
  const captchaField = orderForm ? orderForm.querySelector('textarea[name="h-captcha-response"]') : null;
  return captchaField && typeof captchaField.value === 'string' ? captchaField.value.trim() : '';
}

async function submitOrder(event) {
  event.preventDefault();

  if (!(orderForm instanceof HTMLFormElement)) return;
  if (!orderForm.checkValidity()) {
    orderForm.reportValidity();
    return;
  }

  const orderItems = collectOrderItems();
  if (orderItems.length === 0) {
    setStatus('Add at least one menu item before submitting.', 'is-error');
    return;
  }

  if (!getCaptchaResponse()) {
    setStatus('Please complete the security check before submitting.', 'is-error');
    return;
  }

  const formData = new FormData(orderForm);
  const message = buildOrderMessage(formData, orderItems);
  if (orderMessageInput) {
    orderMessageInput.value = message;
  }

  const payload = new FormData(orderForm);
  if (submitOrderBtn) {
    submitOrderBtn.disabled = true;
    submitOrderBtn.textContent = 'Sending...';
  }

  setStatus('Submitting your order...', 'is-neutral');

  try {
    const response = await fetch(WEB3_ENDPOINT, {
      method: 'POST',
      body: payload
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setStatus(`Could not submit order: ${data.message || 'Unknown error.'}`, 'is-error');
      return;
    }

    orderForm.reset();
    orderItemsHost.innerHTML = '';
    addOrderItem();
    setStatus('Order submitted successfully. We will contact you shortly.', 'is-success');
  } catch {
    setStatus('Something went wrong while sending your order. Please try again.', 'is-error');
  } finally {
    if (submitOrderBtn) {
      submitOrderBtn.disabled = false;
      submitOrderBtn.textContent = 'Submit Order';
    }
  }
}

function attachOrderEvents() {
  if (!orderItemsHost) return;

  orderItemsHost.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.hasAttribute('data-remove-item')) {
      const row = target.closest('[data-order-item]');
      if (!row) return;

      row.remove();
      if (orderItemsHost.querySelectorAll('[data-order-item]').length === 0) {
        addOrderItem();
      }
      refreshItemNames();
    }
  });
}

async function initOrderPage() {
  setFooterYear();
  if (!orderForm || !orderItemsHost || !addOrderItemBtn) return;

  menuOptions = await loadMenu();
  if (menuOptions.length === 0) {
    setStatus('Menu could not be loaded right now. Please refresh and try again.', 'is-error');
    addOrderItemBtn.disabled = true;
    return;
  }

  addOrderItem();
  attachOrderEvents();

  addOrderItemBtn.addEventListener('click', () => {
    addOrderItem();
    refreshItemNames();
  });

  orderForm.addEventListener('submit', submitOrder);
}

initOrderPage();
