// Order Management

// Check admin authentication
if (!isAdminLoggedIn()) {
    window.location.href = '../login.html?admin=true';
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    logout(true);
});

let allOrders = [];
let filteredOrders = [];

// Wait for DB to initialize
let dbReady = false;
const initInterval = setInterval(() => {
    if (db) {
        dbReady = true;
        clearInterval(initInterval);
        initOrders();
    }
}, 100);

async function initOrders() {
    await loadOrders();
    
    // Check if viewing specific order
    const orderId = getQueryParam('orderId');
    if (orderId) {
        await viewOrderDetails(parseInt(orderId));
    }
}

async function loadOrders() {
    try {
        allOrders = await DB.getAll(STORES.ORDERS);
        const customers = await DB.getAll(STORES.CUSTOMERS);
        
        // Enrich orders with customer data
        allOrders = allOrders.map(order => {
            const customer = customers.find(c => c.id === order.customerId);
            return {
                ...order,
                customerName: customer ? customer.name : 'Guest',
                customerEmail: customer ? customer.email : ''
            };
        });

        filteredOrders = [...allOrders];
        displayOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Error loading orders', 'error');
    }
}

function displayOrders() {
    const tbody = document.getElementById('ordersTableBody');
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No orders found</td></tr>';
        return;
    }

    // Sort by date, most recent first
    const sortedOrders = [...filteredOrders].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    tbody.innerHTML = sortedOrders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customerName}</td>
            <td>${order.items.length} item(s)</td>
            <td>${formatCurrency(order.total)}</td>
            <td>
                <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <span class="payment-status status-${order.paymentStatus.toLowerCase()}">${order.paymentStatus}</span>
                ${order.paymentStatus === 'Pending' ? 
                    `<button class="btn-small" onclick="confirmPayment(${order.id})">Confirm</button>` : 
                    ''
                }
            </td>
            <td>${formatDate(order.createdAt)}</td>
            <td>
                <button class="btn-small" onclick="viewOrderDetails(${order.id})">View</button>
                <button class="btn-small" onclick="printOrder(${order.id})">Print</button>
            </td>
        </tr>
    `).join('');
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const order = await DB.get(STORES.ORDERS, orderId);
        if (!order) {
            showNotification('Order not found', 'error');
            return;
        }

        order.status = newStatus;
        order.updatedAt = new Date().toISOString();
        await DB.update(STORES.ORDERS, order);

        showNotification('Order status updated', 'success');
        await loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Error updating order status', 'error');
    }
}

async function confirmPayment(orderId) {
    if (!confirm('Confirm payment for this order?')) {
        return;
    }

    try {
        const order = await DB.get(STORES.ORDERS, orderId);
        if (!order) {
            showNotification('Order not found', 'error');
            return;
        }

        order.paymentStatus = 'Paid';
        order.updatedAt = new Date().toISOString();
        await DB.update(STORES.ORDERS, order);

        showNotification('Payment confirmed', 'success');
        await loadOrders();
    } catch (error) {
        console.error('Error confirming payment:', error);
        showNotification('Error confirming payment', 'error');
    }
}

async function viewOrderDetails(orderId) {
    try {
        const order = await DB.get(STORES.ORDERS, orderId);
        if (!order) {
            showNotification('Order not found', 'error');
            return;
        }

        const customers = await DB.getAll(STORES.CUSTOMERS);
        const customer = customers.find(c => c.id === order.customerId);

        const modal = document.getElementById('orderModal');
        const content = document.getElementById('orderModalContent');
        
        content.innerHTML = `
            <h2>Order #${order.id}</h2>
            <div class="order-details-view">
                <div class="detail-section">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${customer ? customer.name : 'Guest'}</p>
                    <p><strong>Email:</strong> ${customer ? customer.email : order.shippingAddress.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${customer ? customer.phone : 'N/A'}</p>
                </div>
                <div class="detail-section">
                    <h3>Shipping Address</h3>
                    <p>${order.shippingAddress.street}</p>
                    <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}</p>
                </div>
                <div class="detail-section">
                    <h3>Order Items</h3>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${formatCurrency(item.price)}</td>
                                    <td>${formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="detail-section">
                    <h3>Order Summary</h3>
                    <p><strong>Status:</strong> ${order.status}</p>
                    <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
                    <p><strong>Order Date:</strong> ${formatDate(order.createdAt)}</p>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Error loading order details', 'error');
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

function printOrder(orderId) {
    // Open order details in new window for printing
    window.open(`order-print.html?orderId=${orderId}`, '_blank');
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const paymentFilter = document.getElementById('paymentFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    filteredOrders = allOrders.filter(order => {
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;
        if (paymentFilter !== 'all' && order.paymentStatus !== paymentFilter) return false;
        
        if (dateFrom) {
            const orderDate = new Date(order.createdAt);
            const fromDate = new Date(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (orderDate < fromDate) return false;
        }
        
        if (dateTo) {
            const orderDate = new Date(order.createdAt);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (orderDate > toDate) return false;
        }
        
        return true;
    });

    displayOrders();
}

function clearFilters() {
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('paymentFilter').value = 'all';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    filteredOrders = [...allOrders];
    displayOrders();
}

function exportOrders() {
    const data = filteredOrders.map(order => ({
        'Order ID': order.id,
        'Customer': order.customerName,
        'Items': order.items.length,
        'Total': order.total,
        'Status': order.status,
        'Payment Status': order.paymentStatus,
        'Date': formatDate(order.createdAt)
    }));
    exportToCSV(data, `orders_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportOrdersJSON() {
    exportToJSON(filteredOrders, `orders_${new Date().toISOString().split('T')[0]}.json`);
}

