// public/js/script.js

const API_BASE = '/transactions';

document.addEventListener('DOMContentLoaded', () => {
  const txForm      = document.getElementById('transaction-form');
  const limitForm   = document.getElementById('limit-form');
  const listEl      = document.getElementById('transaction-list');
  const incomeEl    = document.getElementById('income-total');
  const expenseEl   = document.getElementById('expense-total');
  const balanceEl   = document.getElementById('balance');

  let allTransactions = [];

  // Fetch and store transactions
  async function fetchTransactions() {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    allTransactions = await res.json();
    return allTransactions;
  }

  // Render list items
  function renderTransactions(txs) {
    listEl.innerHTML = '';
    txs.forEach(tx => {
      const item = document.createElement('div');
      item.classList.add('transaction-item', tx.type);
      item.innerHTML = `
        <div class="transaction-details">
          <span>${new Date(tx.date).toLocaleDateString()}</span>
          <span>${tx.category}</span>
        </div>
        <div class="transaction-meta">
          <span>$${tx.amount.toFixed(2)}</span>
          <button data-id="${tx._id}" class="delete-btn">✕</button>
        </div>`;
      listEl.appendChild(item);
    });
    attachDeleteHandlers();
  }

  // Update totals
  function updateSummary(txs) {
    const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    incomeEl.textContent  = `$${income.toFixed(2)}`;
    expenseEl.textContent = `$${expense.toFixed(2)}`;
    balanceEl.textContent = `$${(income - expense).toFixed(2)}`;
  }

  // Initial load
  async function loadAndDisplay() {
    try {
      const txs = await fetchTransactions();
      renderTransactions(txs);
      updateSummary(txs);
    } catch (err) {
      console.error(err);
      alert('Could not load transactions.');
    }
  }

  // Create new transaction
  txForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      description: txForm.description?.value.trim() || '',
      amount:      parseFloat(txForm.amount.value),
      date:        txForm.date.value,
      category:    txForm.category.value.trim(),
      type:        txForm.type.value
    };
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.message || err.error}`);
        return;
      }
      txForm.reset();
      await loadAndDisplay();
    } catch (err) {
      console.error(err);
      alert('Failed to add transaction.');
    }
  });

  // Set a new budget limit
  limitForm.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      category: limitForm['limit-category'].value.trim(),
      limit:    parseFloat(limitForm['limit-amount'].value)
    };
    try {
      const res = await fetch(`${API_BASE}/limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.message || err.error}`);
        return;
      }
      limitForm.reset();
      alert('Budget limit updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to set budget limit.');
    }
  });

  // Attach delete handlers to each ❌ button
  function attachDeleteHandlers() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
          if (!res.ok) {
            const err = await res.json();
            alert(`Error: ${err.message || err.error}`);
            return;
          }
          await loadAndDisplay();
        } catch (err) {
          console.error(err);
          alert('Failed to delete transaction.');
        }
      };
    });
  }

  // Kick things off
  loadAndDisplay();
});
