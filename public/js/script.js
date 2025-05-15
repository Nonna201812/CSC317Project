document.addEventListener('DOMContentLoaded', () => {
    // === Budget‑Limit AJAX Only ===
    const limitForm = document.getElementById('limit-form');
    if (!limitForm) return;  // Skip if no budget form on page

    const limitCategoryInput  = document.getElementById('limit-category');
    const limitAmountInput    = document.getElementById('limit-amount');
    const currentCategorySpan = document.getElementById('current-category');
    const currentLimitSpan    = document.getElementById('current-limit');

    const getActiveCategory = () => limitCategoryInput.value.trim();

    async function loadLimit() {
        const category = getActiveCategory();
        if (!category) return;
        currentCategorySpan.textContent = category;
        try {
            const res = await fetch(
                `/transactions/limit?category=${encodeURIComponent(category)}`
            );
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const { limit } = await res.json();
            limitAmountInput.value       = limit.toFixed(2);
            currentLimitSpan.textContent = limit.toFixed(2);
        } catch (err) {
            console.warn('Could not load budget limit', err);
        }
    }

    limitForm.addEventListener('submit', async e => {
        e.preventDefault();  // Prevent full-page reload
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
            if (!res.ok) {
                return alert(data.error || 'Failed to save limit');
            }
            currentLimitSpan.textContent = data.limit.toFixed(2);
            alert('Budget limit saved!');
        } catch (err) {
            console.error('Error setting limit', err);
            alert('Network error setting limit');
        }
    });

    limitCategoryInput.addEventListener('change', loadLimit);
    loadLimit();
});
