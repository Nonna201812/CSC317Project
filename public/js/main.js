document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('transaction-form');
    const list = document.getElementById('transaction-list');
    const incomeTotal = document.getElementById('income-total');
    const expenseTotal = document.getElementById('expense-total');
    const balance = document.getElementById('balance');

    // Optional filters (if using)
    const filterType = document.getElementById('filter-type');
    const filterCategory = document.getElementById('filter-category');

    // Fetch initial transactions
    let transactions = [];
    fetch('/transactions')
        .then(response => response.json())
        .then(data => {
            transactions = data;
            updateUI();
        })
        .catch(err => console.error('Failed to fetch transactions:', err));

    form.addEventListener('submit', (e) => {
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

        const transaction = {
            description,
            amount,
            date,
            category,
            type
        };

        // Send to server
        fetch('/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transaction)
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    console.error(data);
                    return;
                }

                transactions.push(data);
                form.reset();
                updateUI();
            })
            .catch(err => {
                alert('Failed to add transaction. Please try again.');
                console.error(err);
            });
    });

    // Filter listeners
    if (filterType && filterCategory) {
        filterType.addEventListener('change', updateUI);
        filterCategory.addEventListener('input', updateUI);
    }

    function updateUI() {
        list.innerHTML = '';
        let income = 0;
        let expense = 0;

        const typeFilter = filterType?.value || 'all';
        const categoryFilter = filterCategory?.value?.toLowerCase() || '';

        const filtered = transactions.filter(t => {
            const typeMatch = typeFilter === 'all' || t.type === typeFilter;
            const categoryMatch = t.category.toLowerCase().includes(categoryFilter);
            return typeMatch && categoryMatch;
        });

        filtered.forEach(t => {
            const item = document.createElement('div');
            item.className = `transaction-item ${t.type}`;

            const details = document.createElement('div');
            details.className = 'transaction-details';
            details.innerHTML = `
                <span class="category">${t.category}</span>
                <span class="description">${t.description}</span>
                <span class="date">${new Date(t.date).toLocaleDateString()}</span>
            `;

            const meta = document.createElement('div');
            meta.className = 'transaction-meta';
            meta.innerHTML = `
                <span class="amount">${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}</span>
            `;

            item.appendChild(details);
            item.appendChild(meta);
            list.appendChild(item);

            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
        });

        incomeTotal.textContent = income.toFixed(2);
        expenseTotal.textContent = expense.toFixed(2);
        balance.textContent = (income - expense).toFixed(2);
    }
});

