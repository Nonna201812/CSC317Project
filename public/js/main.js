// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const txForm          = document.getElementById('transaction-form');
  const limitForm       = document.getElementById('limit-form');
  const txList          = document.getElementById('transaction-list');
  const incomeTotalEl   = document.getElementById('income-total');
  const expenseTotalEl  = document.getElementById('expense-total');
  const balanceEl       = document.getElementById('balance');
  const filterType      = document.getElementById('filter-type');
  const filterCategory  = document.getElementById('filter-category');

  let allTransactions = [];

  async function fetchTransactions() {
    const res = await fetch('/transactions');
    if (!res.ok) throw new Error('Failed to fetch transactions');
    allTransactions = await res.json();
    return allTransactions;
  }

  function renderTransactions(transactions) {
    txList.innerHTML = '';
    transactions.forEach(tx => {
      const item = document.createElement('div');
      item.className = 'transaction-item';
      item.innerHTML = `
        <span>${new Date(tx.date).toLocaleDateString()}</span>
        <span>${tx.category}</span>
        <span>${tx.type}</span>
        <span>$${tx.amount.toFixed(2)}</span>`;
      txList.appendChild(item);
    });
  }

  function updateSummary(transactions) {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    incomeTotalEl.textContent  = income.toFixed(2);
    expenseTotalEl.textContent = expense.toFixed(2);
    balanceEl.textContent      = (income - expense).toFixed(2);
  }

  async function loadAndDisplay() {
    try {
      const txs = await fetchTransactions();
      renderTransactions(txs);
      updateSummary(txs);
    } catch (err) {
      console.error(err);
    }
  }

  txForm.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      description: txForm.description.value,
      amount:      parseFloat(txForm.amount.value),
      date:        txForm.date.value,
      category:    txForm.category.value,
      type:        txForm.type.value
    };
    try {
      const res = await fetch('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const { errors, message } = await res.json();
        console.error(errors || message);
        return;
      }
      txForm.reset();
      await loadAndDisplay();
    } catch (err) {
      console.error(err);
    }
  });

  limitForm.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      category: limitForm.category.value,
      limit:    parseFloat(limitForm.limit.value)
    };
    try {
      const res = await fetch('/transactions/limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const { errors, message } = await res.json();
        console.error(errors || message);
        return;
      }
      limitForm.reset();
      alert('Budget limit set successfully');
    } catch (err) {
      console.error(err);
    }
  });

  function applyFilters() {
    let filtered = [...allTransactions];
    const typeVal = filterType.value;
    const catVal  = filterCategory.value.trim().toLowerCase();
    if (typeVal !== 'all') {
      filtered = filtered.filter(t => t.type === typeVal);
    }
    if (catVal) {
      filtered = filtered.filter(t => t.category.toLowerCase().includes(catVal));
    }
    renderTransactions(filtered);
    updateSummary(filtered);
  }

  filterType.addEventListener('change', applyFilters);
  filterCategory.addEventListener('input', applyFilters);

  loadAndDisplay();
});
