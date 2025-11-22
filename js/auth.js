// Authentication System

// Customer login
async function customerLogin(email, password) {
    try {
        const customers = await DB.getAll(STORES.CUSTOMERS);
        const customer = customers.find(c => c.email === email);
        
        if (!customer) {
            return { success: false, message: 'Invalid email or password' };
        }

        const hashedPassword = await hashPassword(password);
        if (customer.password !== hashedPassword) {
            return { success: false, message: 'Invalid email or password' };
        }

        // Store user in session
        const userData = {
            id: customer.id,
            name: customer.name,
            email: customer.email
        };
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        sessionStorage.setItem('customerLoggedIn', 'true');

        return { success: true, user: userData };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed. Please try again.' };
    }
}

// Customer registration
async function customerRegister(name, email, password, phone, address) {
    try {
        // Validate email
        if (!validateEmail(email)) {
            return { success: false, message: 'Invalid email format' };
        }

        // Check if email already exists
        const existing = await DB.getSingleByIndex(STORES.CUSTOMERS, 'email', email);
        if (existing) {
            return { success: false, message: 'Email already registered' };
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create customer
        const customer = {
            name: sanitizeInput(name),
            email: email.toLowerCase(),
            password: hashedPassword,
            phone: phone || '',
            address: address || {},
            createdAt: new Date().toISOString(),
            orderCount: 0,
            totalSpent: 0
        };

        const customerId = await DB.add(STORES.CUSTOMERS, customer);
        customer.id = customerId;

        // Auto login
        const userData = {
            id: customerId,
            name: customer.name,
            email: customer.email
        };
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        sessionStorage.setItem('customerLoggedIn', 'true');

        return { success: true, user: userData };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Registration failed. Please try again.' };
    }
}

// Admin login
async function adminLogin(username, password) {
    try {
        const admins = await DB.getAll(STORES.ADMIN);
        const admin = admins.find(a => a.username === username);
        
        if (!admin) {
            return { success: false, message: 'Invalid username or password' };
        }

        const hashedPassword = await hashPassword(password);
        if (admin.password !== hashedPassword) {
            return { success: false, message: 'Invalid username or password' };
        }

        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminUser', JSON.stringify({
            id: admin.id,
            username: admin.username,
            role: admin.role
        }));

        return { success: true, admin: admin };
    } catch (error) {
        console.error('Admin login error:', error);
        return { success: false, message: 'Login failed. Please try again.' };
    }
}

// Logout
function logout(isAdmin = false) {
    if (isAdmin) {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminUser');
    } else {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('customerLoggedIn');
    }
    window.location.href = isAdmin ? '../login.html?admin=true' : 'index.html';
}

// Check if customer is logged in
function isCustomerLoggedIn() {
    return sessionStorage.getItem('customerLoggedIn') === 'true';
}

// Get current customer
function getCurrentCustomer() {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

