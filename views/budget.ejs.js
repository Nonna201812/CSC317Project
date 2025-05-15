<header>
    <h1>Budget Planner</h1>
    <p>Track your income and expenses to manage your finances.</p>
</header>

<main class="container">
    <!-- Transaction Form -->
    <section aria-labelledby="add-transaction">
        <h2 id="add-transaction">Add New Transaction</h2>
        <form id="transaction-form">
            <div class="form-group">
                <label for="amount">Amount ($)</label>
                <input type="number" id="amount" name="amount" placeholder="e.g. 200" required>
            </div>

            <div class="form-group">
                <label for="date">Date</label>
                <input type="date" id="date" name="date" required>
            </div>

            <div class="form-group">
                <label for="category">Category</label>
                <input type="text" id="category" name="category" placeholder="e.g. Groceries" required>
            </div>

            <div class="form-group">
                <label for="type">Type</label>
                <select id="type" name="type" required>
                    <option value="" disabled selected>Select type</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            </div>

            <button type="submit">Add Transaction</button>
        </form>
    </section>

    <!-- Budget Limit Section -->
    <section aria-labelledby="set-budget-limit">
        <h2 id="set-budget-limit">Set Budget Limit</h2>
        <form id="limit-form">
            <div class="form-group">
                <label for="limit-category">Category</label>
                <input type="text" id="limit-category" name="limit-category" placeholder="e.g. Groceries" required>
            </div>
            <div class="form-group">
                <label for="limit-amount">Limit ($)</label>
                <input type="number" id="limit-amount" name="limit-amount" placeholder="e.g. 500" min="1" required>
            </div>
            <button type="submit">Set Limit</button>
        </form>
    </section>

    <!-- Filter Section -->
    <section aria-labelledby="filter-transactions" class="filter">
        <h2 id="filter-transactions">Filter Transactions</h2>
        <label for="filter-type">Type:</label>
        <select id="filter-type">
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
        </select>

        <label for="filter-category">Category:</label>
        <input type="text" id="filter-category" placeholder="Search by category...">
    </section>

    <!-- Summary Section -->
    <section class="summary" aria-labelledby="summary-title">
        <h2 id="summary-title">Financial Summary</h2>
        <p><strong>Total Income:</strong> $<span id="income-total">0</span></p>
        <p><strong>Total Expense:</strong> $<span id="expense-total">0</span></p>
        <p><strong>Balance:</strong> $<span id="balance">0</span></p>
    </section>

    <!-- Transaction List -->
    <section aria-labelledby="transaction-history">
        <h2 id="transaction-history">Transaction History</h2>
        <div class="list" id="transaction-list">
            <!-- Transactions will be dynamically inserted here -->
        </div>
    </section>
</main>

<footer>
    <p>&copy; <%= new Date().getFullYear() %> Budget Planner App. All rights reserved.</p>
</footer>

<script src="/js/script.js" defer></script>

<%- include('../partials/footer') %>
