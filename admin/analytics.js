// Analytics & Reports

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
let categoryChart = null;
let statusChart = null;

// Wait for DB to initialize
let dbReady = false;
const initInterval = setInterval(() => {
    if (db) {
        dbReady = true;
        clearInterval(initInterval);
        loadAnalytics();
    }
}, 100);

async function loadAnalytics() {
    const range = document.getElementById('reportRange').value;
    await loadSalesChart(range);
    await loadTopProducts(range);
    await loadCategoryChart(range);
    await loadStatusChart(range);
    await loadSalesReport(range);
}

async function loadSalesChart(range) {
    try {
        const orders = await DB.getAll(STORES.ORDERS);
        const { start, end } = getDateRange(range);
        
        let filteredOrders = orders.filter(o => o.paymentStatus === 'Paid');
        if (start && end) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= start && orderDate <= end;
            });
        }

        // Group by date
        const salesByDate = {};
        filteredOrders.forEach(order => {
            const date = formatDateOnly(order.createdAt);
            if (!salesByDate[date]) {
                salesByDate[date] = 0;
            }
            salesByDate[date] += order.total;
        });

        const labels = Object.keys(salesByDate).sort();
        const data = labels.map(label => salesByDate[label]);

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
                    data: data,
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

async function loadTopProducts(range) {
    try {
        const orders = await DB.getAll(STORES.ORDERS);
        const products = await DB.getAll(STORES.PRODUCTS);
        const { start, end } = getDateRange(range);
        
        let filteredOrders = orders.filter(o => o.paymentStatus === 'Paid');
        if (start && end) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= start && orderDate <= end;
            });
        }

        // Calculate product sales
        const productSales = {};
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.productId].quantity += item.quantity;
                productSales[item.productId].revenue += item.price * item.quantity;
            });
        });

        // Sort by revenue
        const topProducts = Object.entries(productSales)
            .map(([productId, data]) => {
                const product = products.find(p => p.id === parseInt(productId));
                return {
                    productId: parseInt(productId),
                    name: product ? product.name : 'Unknown',
                    quantity: data.quantity,
                    revenue: data.revenue
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        const topProductsDiv = document.getElementById('topProducts');
        if (topProducts.length === 0) {
            topProductsDiv.innerHTML = '<p>No sales data available</p>';
            return;
        }

        topProductsDiv.innerHTML = topProducts.map((item, index) => `
            <div class="top-product-item">
                <span class="rank">${index + 1}.</span>
                <div class="product-info">
                    <strong>${item.name}</strong>
                    <span>${item.quantity} sold - ${formatCurrency(item.revenue)}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading top products:', error);
    }
}

async function loadCategoryChart(range) {
    try {
        const orders = await DB.getAll(STORES.ORDERS);
        const { start, end } = getDateRange(range);
        
        let filteredOrders = orders.filter(o => o.paymentStatus === 'Paid');
        if (start && end) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= start && orderDate <= end;
            });
        }

        // Get products for category lookup
        const products = await DB.getAll(STORES.PRODUCTS);
        
        // Calculate sales by category
        const categorySales = {};
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    if (!categorySales[product.category]) {
                        categorySales[product.category] = 0;
                    }
                    categorySales[product.category] += item.price * item.quantity;
                }
            });
        });

        const labels = Object.keys(categorySales);
        const data = Object.values(categorySales);

        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        if (categoryChart) {
            categoryChart.destroy();
        }

        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    } catch (error) {
        console.error('Error loading category chart:', error);
    }
}

async function loadStatusChart(range) {
    try {
        const orders = await DB.getAll(STORES.ORDERS);
        const { start, end } = getDateRange(range);
        
        let filteredOrders = orders;
        if (start && end) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= start && orderDate <= end;
            });
        }

        // Count by status
        const statusCounts = {};
        filteredOrders.forEach(order => {
            statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });

        const labels = Object.keys(statusCounts);
        const data = Object.values(statusCounts);

        const ctx = document.getElementById('statusChart').getContext('2d');
        
        if (statusChart) {
            statusChart.destroy();
        }

        statusChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Orders',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading status chart:', error);
    }
}

async function loadSalesReport(range) {
    try {
        const orders = await DB.getAll(STORES.ORDERS);
        const { start, end } = getDateRange(range);
        
        let filteredOrders = orders.filter(o => o.paymentStatus === 'Paid');
        if (start && end) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= start && orderDate <= end;
            });
        }

        // Group by date
        const reportByDate = {};
        filteredOrders.forEach(order => {
            const date = formatDateOnly(order.createdAt);
            if (!reportByDate[date]) {
                reportByDate[date] = {
                    orders: 0,
                    revenue: 0
                };
            }
            reportByDate[date].orders += 1;
            reportByDate[date].revenue += order.total;
        });

        const dates = Object.keys(reportByDate).sort().reverse();
        const tbody = document.getElementById('salesReportBody');
        
        if (dates.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No sales data available</td></tr>';
            return;
        }

        tbody.innerHTML = dates.map(date => {
            const data = reportByDate[date];
            const avgOrderValue = data.orders > 0 ? data.revenue / data.orders : 0;
            return `
                <tr>
                    <td>${date}</td>
                    <td>${data.orders}</td>
                    <td>${formatCurrency(data.revenue)}</td>
                    <td>${formatCurrency(avgOrderValue)}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading sales report:', error);
    }
}

async function exportReport() {
    const range = document.getElementById('reportRange').value;
    const orders = await DB.getAll(STORES.ORDERS);
    const { start, end } = getDateRange(range);
    
    let filteredOrders = orders.filter(o => o.paymentStatus === 'Paid');
    if (start && end) {
        filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= start && orderDate <= end;
        });
    }

    const reportData = filteredOrders.map(order => ({
        'Order ID': order.id,
        'Date': formatDate(order.createdAt),
        'Total': order.total,
        'Status': order.status,
        'Payment Status': order.paymentStatus
    }));

    exportToCSV(reportData, `sales_report_${range}_${new Date().toISOString().split('T')[0]}.csv`);
}

