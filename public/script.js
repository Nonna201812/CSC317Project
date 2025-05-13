// public/script.js

const API_BASE = '/api/transactions';

document.addEventListener('DOMContentLoaded', () => {
    // form elements
    const txForm    = document.getElementById('transaction-form');
    const limitForm = document.getElementById('limit-form');
    const listEl    = document.getElementById('transaction-list');
    const incomeEl  = document.getElementById('income-total');
    const expenseEl = document.getElementById('expense-total');
    const balanceEl = document.getElementById('balance');

    // load & render on start
    loadTransactions();

    // Add Transaction
    txForm.addEventListener('submit', async e => {
        e.preventDefault();
        const payload = {
            description: txForm.description?.value || '',
            amount:      parseFloat(txForm.amount.value),
            date:        txForm.date.value,
            category:    txForm.category.value,
            type:        txForm.type.value   // if your back end handles "type"
        };
        await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        txForm.reset();
        loadTransactions();
    });

    // Set Budget Limit
    limitForm.addEventListener('submit', async e => {
        e.preventDefault();
        const payload = {
            category: limitForm['limit-category'].value,
            limit:    parseFloat(limitForm['limit-amount'].value)
        };
        await fetch(API_BASE + '/set-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        limitForm.reset();
        alert('Budget limit set!');
    });

    // Load, filter, and render
    async function loadTransactions() {
        const res = await fetch(API_BASE);
        const txs = await res.json();

        // summary
        let income = 0, expense = 0;
        txs.forEach(tx => {
            if (tx.type === 'income')  income  += tx.amount;
            else                        expense += tx.amount;
        });
        incomeEl.textContent  = income.toFixed(2);
        expenseEl.textContent = expense.toFixed(2);
        balanceEl.textContent = (income - expense).toFixed(2);

        // list
        listEl.innerHTML = '';
        txs.forEach(tx => {
            const div = document.createElement('div');
            div.className = 'tx-item ' + tx.type;
            div.innerHTML = `
        <span>${new Date(tx.date).toLocaleDateString()}</span>
        <span>${tx.category}</span>
        <span>$${tx.amount.toFixed(2)}</span>
        <button data-id="${tx._id}" class="delete">❌</button>
      `;
            listEl.append(div);
        });

        // attach delete handlers
        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
                loadTransactions();
            });
        });
    }
});

