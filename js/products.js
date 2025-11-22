// Product Management

// Get all products
async function getAllProducts() {
    try {
        return await DB.getAll(STORES.PRODUCTS);
    } catch (error) {
        console.error('Error getting products:', error);
        return [];
    }
}

// Get product by ID
async function getProductById(id) {
    try {
        return await DB.get(STORES.PRODUCTS, id);
    } catch (error) {
        console.error('Error getting product:', error);
        return null;
    }
}

// Get products by category
async function getProductsByCategory(category) {
    try {
        return await DB.getByIndex(STORES.PRODUCTS, 'category', category);
    } catch (error) {
        console.error('Error getting products by category:', error);
        return [];
    }
}

// Search products
async function searchProducts(query) {
    try {
        const allProducts = await DB.getAll(STORES.PRODUCTS);
        const lowerQuery = query.toLowerCase();
        return allProducts.filter(product => 
            product.name.toLowerCase().includes(lowerQuery) ||
            product.description.toLowerCase().includes(lowerQuery) ||
            product.category.toLowerCase().includes(lowerQuery) ||
            product.sku.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        console.error('Error searching products:', error);
        return [];
    }
}

// Check product stock
async function checkStock(productId, quantity) {
    try {
        const product = await DB.get(STORES.PRODUCTS, productId);
        if (!product) {
            return { available: false, message: 'Product not found' };
        }
        if (product.stock < quantity) {
            return { available: false, message: `Only ${product.stock} items available` };
        }
        return { available: true, stock: product.stock };
    } catch (error) {
        console.error('Error checking stock:', error);
        return { available: false, message: 'Error checking stock' };
    }
}

// Update product stock
async function updateProductStock(productId, quantity) {
    try {
        const product = await DB.get(STORES.PRODUCTS, productId);
        if (!product) {
            return { success: false, message: 'Product not found' };
        }
        
        product.stock = Math.max(0, product.stock - quantity);
        await DB.update(STORES.PRODUCTS, product);
        
        // Update inventory
        const inventoryItems = await DB.getByIndex(STORES.INVENTORY, 'productId', productId);
        if (inventoryItems.length > 0) {
            const inventory = inventoryItems[0];
            inventory.quantity = product.stock;
            inventory.lastUpdated = new Date().toISOString();
            await DB.update(STORES.INVENTORY, inventory);
        }
        
        return { success: true, stock: product.stock };
    } catch (error) {
        console.error('Error updating stock:', error);
        return { success: false, message: 'Error updating stock' };
    }
}

