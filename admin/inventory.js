// Inventory Management

// Check admin authentication
if (!isAdminLoggedIn()) {
    window.location.href = '../login.html?admin=true';
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    logout(true);
});

let allProducts = [];
let filteredProducts = [];
let editingProductId = null;

// Wait for DB to initialize
let dbReady = false;
const initInterval = setInterval(() => {
    if (db) {
        dbReady = true;
        clearInterval(initInterval);
        initInventory();
    }
}, 100);

async function initInventory() {
    await loadProducts();
}

async function loadProducts() {
    try {
        allProducts = await DB.getAll(STORES.PRODUCTS);
        filteredProducts = [...allProducts];
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
    }
}

function displayProducts() {
    const tbody = document.getElementById('inventoryTableBody');
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredProducts.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.sku}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>
                <input type="number" class="stock-input" value="${product.stock}" 
                       min="0" onchange="updateStock(${product.id}, this.value)">
            </td>
            <td>
                ${product.stock === 0 ? 
                    '<span class="status-badge out-of-stock">Out of Stock</span>' :
                    product.stock <= 10 ? 
                        '<span class="status-badge low-stock">Low Stock</span>' :
                        '<span class="status-badge in-stock">In Stock</span>'
                }
            </td>
            <td>
                <button class="btn-small" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn-small btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function updateStock(productId, newStock) {
    try {
        const product = await DB.get(STORES.PRODUCTS, productId);
        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }

        product.stock = Math.max(0, parseInt(newStock) || 0);
        await DB.update(STORES.PRODUCTS, product);

        // Update inventory
        const inventoryItems = await DB.getByIndex(STORES.INVENTORY, 'productId', productId);
        if (inventoryItems.length > 0) {
            const inventory = inventoryItems[0];
            inventory.quantity = product.stock;
            inventory.lastUpdated = new Date().toISOString();
            await DB.update(STORES.INVENTORY, inventory);
        }

        showNotification('Stock updated', 'success');
        await loadProducts();
    } catch (error) {
        console.error('Error updating stock:', error);
        showNotification('Error updating stock', 'error');
    }
}

function showAddProductModal() {
    editingProductId = null;
    showProductForm();
}

async function editProduct(productId) {
    try {
        const product = await DB.get(STORES.PRODUCTS, productId);
        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }

        editingProductId = productId;
        showProductForm(product);
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Error loading product', 'error');
    }
}

function showProductForm(product = null) {
    const modal = document.getElementById('productModal');
    const content = document.getElementById('productModalContent');
    
    content.innerHTML = `
        <h2>${product ? 'Edit Product' : 'Add New Product'}</h2>
        <form id="productForm" onsubmit="saveProduct(event)">
            <div class="form-group">
                <label for="productName">Product Name *</label>
                <input type="text" id="productName" value="${product ? product.name : ''}" required>
            </div>
            <div class="form-group">
                <label for="productCategory">Category *</label>
                <select id="productCategory" required>
                    <option value="Cosmetics" ${product && product.category === 'Cosmetics' ? 'selected' : ''}>Cosmetics</option>
                    <option value="Groceries" ${product && product.category === 'Groceries' ? 'selected' : ''}>Groceries</option>
                </select>
            </div>
            <div class="form-group">
                <label for="productSKU">SKU *</label>
                <input type="text" id="productSKU" value="${product ? product.sku : ''}" required>
            </div>
            <div class="form-group">
                <label for="productPrice">Price *</label>
                <input type="number" id="productPrice" step="0.01" min="0" value="${product ? product.price : ''}" required>
            </div>
            <div class="form-group">
                <label for="productStock">Stock *</label>
                <input type="number" id="productStock" min="0" value="${product ? product.stock : '0'}" required>
            </div>
            <div class="form-group">
                <label for="productImage">Image URL</label>
                <input type="url" id="productImage" value="${product ? product.image : ''}">
            </div>
            <div class="form-group">
                <label for="productDescription">Description *</label>
                <textarea id="productDescription" rows="5" required>${product ? product.description : ''}</textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">${product ? 'Update' : 'Add'} Product</button>
                <button type="button" class="btn btn-secondary" onclick="closeProductModal()">Cancel</button>
            </div>
        </form>
    `;

    modal.style.display = 'block';
}

async function saveProduct(event) {
    event.preventDefault();

    try {
        const productData = {
            name: document.getElementById('productName').value.trim(),
            category: document.getElementById('productCategory').value,
            sku: document.getElementById('productSKU').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            image: document.getElementById('productImage').value.trim() || 'https://via.placeholder.com/300x300?text=Product',
            description: document.getElementById('productDescription').value.trim()
        };

        if (editingProductId) {
            // Update existing product
            const existing = await DB.get(STORES.PRODUCTS, editingProductId);
            productData.id = editingProductId;
            productData.createdAt = existing.createdAt;
            await DB.update(STORES.PRODUCTS, productData);

            // Update inventory
            const inventoryItems = await DB.getByIndex(STORES.INVENTORY, 'productId', editingProductId);
            if (inventoryItems.length > 0) {
                const inventory = inventoryItems[0];
                inventory.quantity = productData.stock;
                inventory.lastUpdated = new Date().toISOString();
                await DB.update(STORES.INVENTORY, inventory);
            }

            showNotification('Product updated successfully', 'success');
        } else {
            // Add new product
            productData.createdAt = new Date().toISOString();
            const productId = await DB.add(STORES.PRODUCTS, productData);

            // Create inventory entry
            await DB.add(STORES.INVENTORY, {
                productId: productId,
                quantity: productData.stock,
                lowStockThreshold: 10,
                lastUpdated: new Date().toISOString()
            });

            showNotification('Product added successfully', 'success');
        }

        closeProductModal();
        await loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Error saving product', 'error');
    }
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
    editingProductId = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeProductModal();
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }

    try {
        await DB.delete(STORES.PRODUCTS, productId);
        
        // Delete inventory entry
        const inventoryItems = await DB.getByIndex(STORES.INVENTORY, 'productId', productId);
        if (inventoryItems.length > 0) {
            await DB.delete(STORES.INVENTORY, inventoryItems[0].id);
        }

        showNotification('Product deleted successfully', 'success');
        await loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product', 'error');
    }
}

function applyInventoryFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;

    filteredProducts = allProducts.filter(product => {
        if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
        if (stockFilter === 'low' && product.stock > 10) return false;
        if (stockFilter === 'out' && product.stock > 0) return false;
        return true;
    });

    displayProducts();
}

function clearInventoryFilters() {
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('stockFilter').value = 'all';
    filteredProducts = [...allProducts];
    displayProducts();
}

function exportInventory() {
    const data = filteredProducts.map(product => ({
        'ID': product.id,
        'Name': product.name,
        'Category': product.category,
        'SKU': product.sku,
        'Price': product.price,
        'Stock': product.stock,
        'Description': product.description
    }));
    exportToCSV(data, `inventory_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportInventoryJSON() {
    exportToJSON(filteredProducts, `inventory_${new Date().toISOString().split('T')[0]}.json`);
}

