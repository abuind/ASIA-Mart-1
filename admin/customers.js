// Customer Management

// Check admin authentication
if (!isAdminLoggedIn()) {
    window.location.href = '../login.html?admin=true';
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    logout(true);
});

let allCustomers = [];
let filteredCustomers = [];

// Wait for DB to initialize
let dbReady = false;
const initInterval = setInterval(() => {
    if (db) {
        dbReady = true;
        clearInterval(initInterval);
        initCustomers();
    }
}, 100);

async function initCustomers() {
    await loadCustomers();
    
    // Setup search
    const searchInput = document.getElementById('customerSearch');
    const debouncedSearch = debounce((query) => {
        if (query.trim()) {
            filteredCustomers = allCustomers.filter(customer => {
                const searchTerm = query.toLowerCase();
                return customer.name.toLowerCase().includes(searchTerm) ||
                       customer.email.toLowerCase().includes(searchTerm) ||
                       (customer.phone && customer.phone.includes(searchTerm));
            });
        } else {
            filteredCustomers = [...allCustomers];
        }
        displayCustomers();
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
}

async function loadCustomers() {
    try {
        allCustomers = await DB.getAll(STORES.CUSTOMERS);
        const orders = await DB.getAll(STORES.ORDERS);

        // Enrich customers with order data
        allCustomers = allCustomers.map(customer => {
            const customerOrders = orders.filter(o => o.customerId === customer.id);
            return {
                ...customer,
                orderCount: customerOrders.length,
                totalSpent: customerOrders
                    .filter(o => o.paymentStatus === 'Paid')
                    .reduce((sum, order) => sum + order.total, 0)
            };
        });

        filteredCustomers = [...allCustomers];
        displayCustomers();
    } catch (error) {
        console.error('Error loading customers:', error);
        showNotification('Error loading customers', 'error');
    }
}

function displayCustomers() {
    const tbody = document.getElementById('customersTableBody');
    
    if (filteredCustomers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No customers found</td></tr>';
        return;
    }

    // Sort by total spent, highest first
    const sortedCustomers = [...filteredCustomers].sort((a, b) => 
        (b.totalSpent || 0) - (a.totalSpent || 0)
    );

    tbody.innerHTML = sortedCustomers.map(customer => `
        <tr>
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone || 'N/A'}</td>
            <td>${customer.orderCount || 0}</td>
            <td>${formatCurrency(customer.totalSpent || 0)}</td>
            <td>${formatDateOnly(customer.createdAt)}</td>
            <td>
                <button class="btn-small" onclick="viewCustomerDetails(${customer.id})">View</button>
            </td>
        </tr>
    `).join('');
}

async function viewCustomerDetails(customerId) {
    try {
        const customer = await DB.get(STORES.CUSTOMERS, customerId);
        if (!customer) {
            showNotification('Customer not found', 'error');
            return;
        }

        const orders = await DB.getByIndex(STORES.ORDERS, 'customerId', customerId);
        const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const modal = document.getElementById('customerModal');
        const content = document.getElementById('customerModalContent');
        
        content.innerHTML = `
            <h2>Customer Details</h2>
            <div class="customer-details-view">
                <div class="detail-section">
                    <h3>Personal Information</h3>
                    <p><strong>ID:</strong> ${customer.id}</p>
                    <p><strong>Name:</strong> ${customer.name}</p>
                    <p><strong>Email:</strong> ${customer.email}</p>
                    <p><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>
                    <p><strong>Member Since:</strong> ${formatDate(customer.createdAt)}</p>
                </div>
                <div class="detail-section">
                    <h3>Address</h3>
                    ${customer.address && customer.address.street ? `
                        <p>${customer.address.street}</p>
                        <p>${customer.address.city}, ${customer.address.state} ${customer.address.zip}</p>
                    ` : '<p>No address on file</p>'}
                </div>
                <div class="detail-section">
                    <h3>Order Statistics</h3>
                    <p><strong>Total Orders:</strong> ${orders.length}</p>
                    <p><strong>Total Spent:</strong> ${formatCurrency(
                        orders.filter(o => o.paymentStatus === 'Paid')
                            .reduce((sum, order) => sum + order.total, 0)
                    )}</p>
                </div>
                <div class="detail-section">
                    <h3>Order History</h3>
                    ${sortedOrders.length === 0 ? 
                        '<p>No orders yet</p>' :
                        `<table class="items-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedOrders.map(order => `
                                    <tr>
                                        <td><a href="orders.html?orderId=${order.id}">#${order.id}</a></td>
                                        <td>${formatDate(order.createdAt)}</td>
                                        <td>${formatCurrency(order.total)}</td>
                                        <td>${order.status}</td>
                                        <td>${order.paymentStatus}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>`
                    }
                </div>
            </div>
        `;

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading customer details:', error);
        showNotification('Error loading customer details', 'error');
    }
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('customerModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

function exportCustomers() {
    const data = filteredCustomers.map(customer => ({
        'ID': customer.id,
        'Name': customer.name,
        'Email': customer.email,
        'Phone': customer.phone || '',
        'Orders': customer.orderCount || 0,
        'Total Spent': customer.totalSpent || 0,
        'Joined': formatDateOnly(customer.createdAt)
    }));
    exportToCSV(data, `customers_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportCustomersJSON() {
    exportToJSON(filteredCustomers, `customers_${new Date().toISOString().split('T')[0]}.json`);
}

