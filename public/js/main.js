document.addEventListener('DOMContentLoaded', () => {
    // === Transaction Handling ===
    const form = document.getElementById('transaction-form');
    const list = document.getElementById('transaction-list');
    const incomeTotal = document.getElementById('income-total');
    const expenseTotal = document.getElementById('expense-total');
    const balance = document.getElementById('balance');

    const filterType = document.getElementById('filter-type');
    const filterCategory = document.getElementById('filter-category');

    let transactions = [];

    // Fetch initial transactions
    fetch('/transactions')
        .then(res => res.json())
        .then(data => {
            transactions = data;
            updateUI();
        })
        .catch(err => console.error('Failed to fetch transactions:', err));

    // Add new transaction
    form.addEventListener('submit', e => {
        e.preventDefault();
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const category = document.getElementById('category').value.trim();
        const type = document.getElementById('type').value;

        if (!description || !amount || !date || !category || isNaN(amount)) {
            alert('Please fill in all fields correctly.');
            return;
        }

        const transaction = { description, amount, date, category, type };
        fetch('/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        })
            .then(r => r.json())
            .then(data => {
                if (data.error) return alert(data.error);
                transactions.push(data);
                form.reset();
                updateUI();
            })
            .catch(() => alert('Failed to add transaction.'));
    });

    // Filters
    if (filterType && filterCategory) {
        filterType.addEventListener('change', updateUI);
        filterCategory.addEventListener('input', updateUI);
    }

    // Render UI
    function updateUI() {
        list.innerHTML = '';
        let inc = 0, exp = 0;
        const typeF = filterType?.value || 'all';
        const catF  = filterCategory?.value.toLowerCase() || '';

        transactions
            .filter(t => (typeF === 'all' || t.type === typeF) && t.category.toLowerCase().includes(catF))
            .forEach(t => {
                const item = document.createElement('div');
                item.className = `transaction-item ${t.type}`;
                item.innerHTML = `
          <div class="transaction-details">
            <span class="category">${t.category}</span>
            <span class="description">${t.description}</span>
            <span class="date">${new Date(t.date).toLocaleDateString()}</span>
          </div>
          <div class="transaction-meta">
            <span class="amount">${t.type === 'income' ? '+' : '-'}\$${t.amount.toFixed(2)}</span>
          </div>
        `;
                list.appendChild(item);
                t.type === 'income' ? inc += t.amount : exp += t.amount;
            });
        incomeTotal.textContent = inc.toFixed(2);
        expenseTotal.textContent = exp.toFixed(2);
        balance.textContent = (inc - exp).toFixed(2);
    }

    // === Budget‑Limit AJAX ===
    const limitForm = document.getElementById('limit-form');
    if (limitForm) {
        const limitCategoryInput  = document.getElementById('limit-category');
        const limitAmountInput    = document.getElementById('limit-amount');
        const currentLimitSpan    = document.getElementById('current-limit');
        const getActiveCategory   = () => limitCategoryInput.value.trim();

        async function loadLimit() {
            const category = getActiveCategory();
            if (!category) return;
            try {
                const res = await fetch(`/transactions/limit?category=${encodeURIComponent(category)}`);
                if (!res.ok) return console.warn('Fetch limit failed', res.status);
                const { limit } = await res.json();
                limitAmountInput.value    = limit.toFixed(2);
                currentLimitSpan.textContent = limit.toFixed(2);
            } catch (err) {
                console.warn('Could not load budget limit', err);
            }
        }

        limitForm.addEventListener('submit', async e => {
            e.preventDefault();
            const category = getActiveCategory();
            const value    = parseFloat(limitAmountInput.value);
            if (!category || isNaN(value) || value <= 0) {
                return alert('Enter a valid category and positive limit.');
            }
            try {
                const res = await fetch('/transactions/set-limit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category, limit: value })
                });
                const data = await res.json();
                if (!res.ok) return alert(data.error || 'Failed to save limit');
                currentLimitSpan.textContent = data.limit.toFixed(2);
                alert('Budget limit saved!');
            } catch (err) {
                console.error('Error setting limit', err);
                alert('Network error');
            }
        });

        limitCategoryInput.addEventListener('change', loadLimit);
        loadLimit();
    }
});
