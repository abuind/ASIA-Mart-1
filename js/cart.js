// Shopping Cart Functionality

// Get cart items
async function getCartItems() {
    try {
        const userId = getCurrentUserId();
        const sessionId = userId ? null : getSessionId();
        
        const allCartItems = await DB.getAll(STORES.CART);
        const products = await DB.getAll(STORES.PRODUCTS);
        
        // Filter cart items by user
        let cartItems = allCartItems.filter(item => {
            if (userId) {
                return item.userId === userId;
            } else {
                return item.userId === sessionId;
            }
        });

        // Enrich with product data
        return cartItems.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                ...item,
                product: product,
                price: product ? product.price : 0,
                name: product ? product.name : 'Unknown Product',
                image: product ? product.image : '',
                stock: product ? product.stock : 0
            };
        }).filter(item => item.product); // Remove items with missing products
    } catch (error) {
        console.error('Error getting cart items:', error);
        return [];
    }
}

// Add to cart
async function addToCart(productId, quantity = 1) {
    try {
        // Check stock
        const stockCheck = await checkStock(productId, quantity);
        if (!stockCheck.available) {
            return { success: false, message: stockCheck.message };
        }

        const userId = getCurrentUserId();
        const sessionId = userId ? null : getSessionId();
        
        // Check if item already in cart
        const allCartItems = await DB.getAll(STORES.CART);
        const existingItem = allCartItems.find(item => {
            if (userId) {
                return item.productId === productId && item.userId === userId;
            } else {
                return item.productId === productId && item.userId === sessionId;
            }
        });

        if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + quantity;
            const stockCheck = await checkStock(productId, newQuantity);
            if (!stockCheck.available) {
                return { success: false, message: stockCheck.message };
            }
            existingItem.quantity = newQuantity;
            await DB.update(STORES.CART, existingItem);
            return { success: true, message: 'Cart updated' };
        } else {
            // Add new item
            await DB.add(STORES.CART, {
                productId: productId,
                quantity: quantity,
                userId: userId || sessionId
            });
            return { success: true, message: 'Added to cart' };
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        return { success: false, message: 'Error adding to cart' };
    }
}

// Update cart item quantity
async function updateCartItem(cartItemId, quantity) {
    try {
        if (quantity <= 0) {
            return await removeFromCart(cartItemId);
        }

        const cartItem = await DB.get(STORES.CART, cartItemId);
        if (!cartItem) {
            return { success: false, message: 'Cart item not found' };
        }

        // Check stock
        const stockCheck = await checkStock(cartItem.productId, quantity);
        if (!stockCheck.available) {
            return { success: false, message: stockCheck.message };
        }

        cartItem.quantity = quantity;
        await DB.update(STORES.CART, cartItem);
        return { success: true, message: 'Cart updated' };
    } catch (error) {
        console.error('Error updating cart item:', error);
        return { success: false, message: 'Error updating cart' };
    }
}

// Remove from cart
async function removeFromCart(cartItemId) {
    try {
        await DB.delete(STORES.CART, cartItemId);
        return { success: true, message: 'Item removed from cart' };
    } catch (error) {
        console.error('Error removing from cart:', error);
        return { success: false, message: 'Error removing item' };
    }
}

// Clear cart
async function clearCart() {
    try {
        const userId = getCurrentUserId();
        const sessionId = userId ? null : getSessionId();
        
        const allCartItems = await DB.getAll(STORES.CART);
        const itemsToRemove = allCartItems.filter(item => {
            if (userId) {
                return item.userId === userId;
            } else {
                return item.userId === sessionId;
            }
        });

        for (const item of itemsToRemove) {
            await DB.delete(STORES.CART, item.id);
        }

        return { success: true };
    } catch (error) {
        console.error('Error clearing cart:', error);
        return { success: false };
    }
}

// Get cart count
async function getCartCount() {
    try {
        const items = await getCartItems();
        return items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
        return 0;
    }
}

// Calculate cart total
function calculateCartTotal(cartItems) {
    return cartItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

// Update cart count display
async function updateCartCountDisplay() {
    const count = await getCartCount();
    const cartBadge = document.querySelector('.cart-count');
    if (cartBadge) {
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? 'block' : 'none';
    }
}

