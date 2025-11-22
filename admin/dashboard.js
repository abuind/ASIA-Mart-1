// Admin Dashboard Logic

// Check admin authentication
if (!isAdminLoggedIn()) {
    window.location.href = '../login.html?admin=true';
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    logout(true);
});

let salesChart = null;

// Wait for DB to initialize
let dbReady = false;
const initInterval = setInterval(() => {
    if (db) {
        dbReady = true;
        clearInterval(initInterval);
        initDashboard();
    }
}, 100);

async function initDashboard() {
    await loadMetrics();
    await loadRecentOrders();
    await loadSalesChart();
}

async function loadMetrics() {
    try {
        const orders = await DB.getAll(STORES.ORDERS);
        const customers = await DB.getAll(STORES.CUSTOMERS);
        const products = await DB.getAll(STORES.PRODUCTS);
        const inventory = await DB.getAll(STORES.INVENTORY);

        // Total orders
        document.getElementById('totalOrders').textContent = orders.length;

        // Total revenue
        const totalRevenue = orders
            .filter(o => o.paymentStatus === 'Paid')
            .reduce((sum, order) => sum + order.total, 0);
        document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);

        // Total customers
        document.getElementById('totalCustomers').textContent = customers.length;

        // Low stock items
        const lowStockCount = products.filter(p => p.stock <= 10).length;
        document.getElementById('lowStockItems').textContent = lowStockCount;
    } catch (error) {
        console.error('Error loading metrics:', error);
    }
}

async function loadRecentOrders() {
    try {
        const orders = await DB.getAll(STORES.ORDERS);
        const customers = await DB.getAll(STORES.CUSTOMERS);

        // Sort by date, most recent first
        const recentOrders = orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        const ordersDiv = document.getElementById('recentOrders');
        if (recentOrders.length === 0) {
            ordersDiv.innerHTML = '<p>No orders yet.</p>';
            return;
        }

        ordersDiv.innerHTML = recentOrders.map(order => {
            const customer = customers.find(c => c.id === order.customerId);
            return `
                <div class="recent-order-item">
                    <div class="order-info">
                        <strong>Order #${order.id}</strong>
                        <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
                    </div>
                    <div class="order-details">
                        <span>${customer ? customer.name : 'Guest'}</span>
                        <span>${formatCurrency(order.total)}</span>
                        <span>${formatDate(order.createdAt)}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        ordersDiv.querySelectorAll('.recent-order-item').forEach((item, index) => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                window.location.href = `orders.html?orderId=${recentOrders[index].id}`;
            });
        });
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

async function loadSalesChart() {
    try {
        const orders = await DB.getAll(STORES.ORDERS);
        const now = new Date();
        const last7Days = [];

        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            last7Days.push(date);
        }

        // Calculate sales for each day
        const salesData = last7Days.map(date => {
            const dayStart = new Date(date);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const daySales = orders
                .filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= dayStart && orderDate <= dayEnd && order.paymentStatus === 'Paid';
                })
                .reduce((sum, order) => sum + order.total, 0);

            return daySales;
        });

        const labels = last7Days.map(date => formatDateOnly(date.toISOString()));

        const ctx = document.getElementById('salesChart').getContext('2d');
        
        if (salesChart) {
            salesChart.destroy();
        }

        salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales ($)',
                    data: salesData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading sales chart:', error);
    }
}

