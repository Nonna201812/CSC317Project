document.addEventListener('DOMContentLoaded', () => {
    // === Budget‑Limit AJAX Only ===
    const limitForm = document.getElementById('limit-form');
    if (!limitForm) return;  // If there’s no limit form on the page, do nothing

    const limitCategoryInput = document.getElementById('limit-category');
    const limitAmountInput   = document.getElementById('limit-amount');
    const currentLimitSpan   = document.getElementById('current-limit');

    const getActiveCategory = () => limitCategoryInput.value.trim();

    // Fetch the saved limit and populate the form + display
    async function loadLimit() {
        const category = getActiveCategory();
        if (!category) return;
        try {
            const res = await fetch(
                `/transactions/limit?category=${encodeURIComponent(category)}`
            );
            if (!res.ok) {
                console.warn(`Failed to fetch budget limit, status: ${res.status}`);
                return;
            }
            const { limit } = await res.json();
            limitAmountInput.value     = limit.toFixed(2);
            currentLimitSpan.textContent = limit.toFixed(2);
        } catch (err) {
            console.warn('Could not load budget limit', err);
        }
    }

    // Send the new limit to the server without reloading the page
    limitForm.addEventListener('submit', async (e) => {
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
            if (!res.ok) {
                alert(data.error || 'Failed to save limit');
                return;
            }
            currentLimitSpan.textContent = data.limit.toFixed(2);
            alert('Budget limit saved!');
        } catch (err) {
            console.error('Error setting limit', err);
            alert('Network error setting limit');
        }
    });

    // Re‑load whenever the category input changes
    limitCategoryInput.addEventListener('change', () => {
        loadLimit().catch((err) => console.warn('Error in loadLimit', err));
    });

    // Initial load
    loadLimit().catch((err) => console.warn('Error in loadLimit', err));
});
