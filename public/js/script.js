// public/script.js

const API_BASE = '/api/transactions';

document.addEventListener('DOMContentLoaded', () => {
    // form elements
    const txForm = document.getElementById('transaction-form');
    const limitForm = document.getElementById('limit-form');
    const listEl = document.getElementById('transaction-list');
    const incomeEl = document.getElementById('income-total');
    const expenseEl = document.getElementById('expense-total');
    const balanceEl = document.getElementById('balance');

    // load & render on start
    loadTransactions();

    // Add Transaction
    txForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            description: txForm.description?.value.trim(),
            amount: parseFloat(txForm.amount.value),
            date: txForm.date.value,
            category: txForm.category.value.trim(),
            type: txForm.type.value   // Correctly include the type
        };

        try {
            const res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error: ${err.error}`);
                return;
            }

            txForm.reset();
            loadTransactions();
        } catch (err) {
            console.error('Failed to add transaction:', err);
        }
    });

    // Set Budget Limit
    limitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            category: limitForm['limit-category'].value.trim(),
            limit: parseFloat(limitForm['limit-amount'].value)
        };

        try {
            const res = await fetch(API_BASE + '/set-limit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Error: ${err.error}`);
                return;
            }

            limitForm.reset();
            alert('Budget limit set!');
        } catch (err) {
            console.error('Failed to set budget limit:', err);
        }
    });

    // Load, filter, and render
    async function loadTransactions() {
        try {
            const res = await fetch(API_BASE);
            const txs = await res.json();

            let income = 0, expense = 0;
            listEl.innerHTML = '';
            txs.forEach(tx => {
                const div = document.createElement('div');
                div.className = 'tx-item ' + tx.type;
                div.innerHTML = `
                    <span>${new Date(tx.date).toLocaleDateString()}</span>
                    <span>${tx.category}</span>
                    <span>$${tx.amount.toFixed(2)}</span>
                    <span>${tx.type}</span>
                    <button data-id="${tx._id}" class="delete">❌</button>
                `;
                listEl.append(div);

                if (tx.type === 'income') {
                    income += tx.amount;
                } else {
                    expense += tx.amount;
                }
            });

            incomeEl.textContent = income.toFixed(2);
            expenseEl.textContent = expense.toFixed(2);
            balanceEl.textContent = (income - expense).toFixed(2);

            attachDeleteHandlers();
        } catch (err) {
            console.error('Failed to load transactions:', err);
        }
    }

    function attachDeleteHandlers() {
        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                try {
                    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
                    if (!res.ok) {
                        const err = await res.json();
                        alert(`Error: ${err.error}`);
                        return;
                    }
                    loadTransactions();
                } catch (err) {
                    console.error('Failed to delete transaction:', err);
                }
            });
        });
    }
});
