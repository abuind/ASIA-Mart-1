// IndexedDB Database Setup and Operations
const DB_NAME = 'CosmeticsEcommerceDB';
const DB_VERSION = 1;

let db = null;

// Database stores
const STORES = {
    PRODUCTS: 'products',
    ORDERS: 'orders',
    CUSTOMERS: 'customers',
    CART: 'cart',
    INVENTORY: 'inventory',
    ADMIN: 'admin'
};

// Initialize database
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Products store
            if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
                const productsStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id', autoIncrement: true });
                productsStore.createIndex('category', 'category', { unique: false });
                productsStore.createIndex('name', 'name', { unique: false });
            }

            // Orders store
            if (!db.objectStoreNames.contains(STORES.ORDERS)) {
                const ordersStore = db.createObjectStore(STORES.ORDERS, { keyPath: 'id', autoIncrement: true });
                ordersStore.createIndex('customerId', 'customerId', { unique: false });
                ordersStore.createIndex('status', 'status', { unique: false });
                ordersStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Customers store
            if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
                const customersStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id', autoIncrement: true });
                customersStore.createIndex('email', 'email', { unique: true });
            }

            // Cart store
            if (!db.objectStoreNames.contains(STORES.CART)) {
                const cartStore = db.createObjectStore(STORES.CART, { keyPath: 'id', autoIncrement: true });
                cartStore.createIndex('productId', 'productId', { unique: false });
                cartStore.createIndex('userId', 'userId', { unique: false });
            }

            // Inventory store
            if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
                const inventoryStore = db.createObjectStore(STORES.INVENTORY, { keyPath: 'id', autoIncrement: true });
                inventoryStore.createIndex('productId', 'productId', { unique: true });
            }

            // Admin store
            if (!db.objectStoreNames.contains(STORES.ADMIN)) {
                const adminStore = db.createObjectStore(STORES.ADMIN, { keyPath: 'id', autoIncrement: true });
                adminStore.createIndex('username', 'username', { unique: true });
            }
        };
    });
}

// Generic CRUD operations
const DB = {
    // Add item
    add(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get item by key
    get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get all items
    getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Update item
    update(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Delete item
    delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // Get by index
    getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get single by index
    getSingleByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.get(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Clear store
    clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};

// Initialize database on load
if (typeof window !== 'undefined') {
    initDB().then(() => {
        console.log('Database initialized');
        // Initialize sample data if needed
        initializeSampleData();
    }).catch(err => {
        console.error('Database initialization failed:', err);
    });
}

// Initialize sample data
async function initializeSampleData() {
    try {
        // Check if admin exists
        const admins = await DB.getAll(STORES.ADMIN);
        if (admins.length === 0) {
            // Create default admin
            const adminPassword = await hashPassword('admin123');
            await DB.add(STORES.ADMIN, {
                username: 'admin',
                password: adminPassword,
                role: 'admin',
                createdAt: new Date().toISOString()
            });
        }

        // Check if products exist
        const products = await DB.getAll(STORES.PRODUCTS);
        if (products.length === 0) {
            // Add sample products
            const sampleProducts = [
                {
                    name: 'Lavender Homemade Soap',
                    category: 'Cosmetics',
                    description: 'Handmade lavender soap with natural ingredients, perfect for sensitive skin. Made with organic lavender oil and shea butter.',
                    price: 8.99,
                    image: 'https://via.placeholder.com/300x300?text=Lavender+Soap',
                    stock: 50,
                    sku: 'SOAP-LAV-001',
                    createdAt: new Date().toISOString()
                },
                {
                    name: 'Rose Petal Soap',
                    category: 'Cosmetics',
                    description: 'Delicate rose petal handmade soap with moisturizing properties. Enriched with rosehip oil and vitamin E.',
                    price: 9.99,
                    image: 'https://via.placeholder.com/300x300?text=Rose+Soap',
                    stock: 45,
                    sku: 'SOAP-ROS-002',
                    createdAt: new Date().toISOString()
                },
                {
                    name: 'Honey & Oatmeal Soap',
                    category: 'Cosmetics',
                    description: 'Nourishing honey and oatmeal soap for dry skin. Contains natural honey, colloidal oatmeal, and coconut oil.',
                    price: 7.99,
                    image: 'https://via.placeholder.com/300x300?text=Honey+Soap',
                    stock: 60,
                    sku: 'SOAP-HON-003',
                    createdAt: new Date().toISOString()
                },
                {
                    name: 'Tea Tree Soap',
                    category: 'Cosmetics',
                    description: 'Antibacterial tea tree soap ideal for acne-prone skin. Made with tea tree essential oil and activated charcoal.',
                    price: 8.49,
                    image: 'https://via.placeholder.com/300x300?text=Tea+Tree+Soap',
                    stock: 40,
                    sku: 'SOAP-TEA-004',
                    createdAt: new Date().toISOString()
                },
                {
                    name: 'Shikkakai Powder - 500g',
                    category: 'Cosmetics',
                    description: 'Pure Shikkakai powder for natural hair care. Promotes hair growth, prevents dandruff, and adds shine to hair.',
                    price: 12.99,
                    image: 'https://via.placeholder.com/300x300?text=Shikkakai+Powder',
                    stock: 30,
                    sku: 'SHIK-500-001',
                    createdAt: new Date().toISOString()
                },
                {
                    name: 'Shikkakai Powder - 1kg',
                    category: 'Cosmetics',
                    description: 'Pure Shikkakai powder for natural hair care. Larger size for better value. Promotes hair growth and prevents dandruff.',
                    price: 22.99,
                    image: 'https://via.placeholder.com/300x300?text=Shikkakai+1kg',
                    stock: 25,
                    sku: 'SHIK-1KG-002',
                    createdAt: new Date().toISOString()
                },
                {
                    name: 'Organic Turmeric Powder',
                    category: 'Groceries',
                    description: 'Premium organic turmeric powder, perfect for cooking and health benefits. Rich in curcumin.',
                    price: 6.99,
                    image: 'https://via.placeholder.com/300x300?text=Turmeric',
                    stock: 100,
                    sku: 'GROC-TUR-001',
                    createdAt: new Date().toISOString()
                },
                {
                    name: 'Organic Cumin Seeds',
                    category: 'Groceries',
                    description: 'High-quality organic cumin seeds, whole and aromatic. Perfect for Indian cuisine.',
                    price: 5.99,
                    image: 'https://via.placeholder.com/300x300?text=Cumin',
                    stock: 80,
                    sku: 'GROC-CUM-002',
                    createdAt: new Date().toISOString()
                },
                {
                    name: 'Organic Red Lentils',
                    category: 'Groceries',
                    description: 'Premium organic red lentils, rich in protein and fiber. Great for soups and curries.',
                    price: 4.99,
                    image: 'https://via.placeholder.com/300x300?text=Lentils',
                    stock: 120,
                    sku: 'GROC-LEN-003',
                    createdAt: new Date().toISOString()
                },
                {
                    name: 'Organic Basmati Rice - 2kg',
                    category: 'Groceries',
                    description: 'Premium long-grain basmati rice, aged for superior flavor and aroma. Perfect for biryanis and pulao.',
                    price: 15.99,
                    image: 'https://via.placeholder.com/300x300?text=Basmati+Rice',
                    stock: 70,
                    sku: 'GROC-RIC-004',
                    createdAt: new Date().toISOString()
                }
            ];

            for (const product of sampleProducts) {
                await DB.add(STORES.PRODUCTS, product);
                // Create inventory entry
                await DB.add(STORES.INVENTORY, {
                    productId: product.id || (await DB.getAll(STORES.PRODUCTS)).length,
                    quantity: product.stock,
                    lowStockThreshold: 10,
                    lastUpdated: new Date().toISOString()
                });
            }
        }
    } catch (error) {
        console.error('Error initializing sample data:', error);
    }
}

// Simple password hashing (for demo purposes)
async function hashPassword(password) {
    // Simple hash function for demo (not secure for production)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

