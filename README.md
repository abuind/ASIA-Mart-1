# Asia Mart - Ecommerce Website

A complete ecommerce website for cosmetics (homemade soaps, Shikkakai powder) and groceries with a comprehensive admin panel. Built with HTML, CSS, and JavaScript using IndexedDB for browser-based storage - no installation or local database required!

## Features

### Customer-Facing Features
- **Product Browsing**: Browse products by category (Cosmetics, Groceries)
- **Product Search**: Search products by name, description, or SKU
- **Product Details**: View detailed product information with images
- **Shopping Cart**: Add items to cart, update quantities, remove items
- **Checkout**: Guest checkout or optional account creation
- **Order Confirmation**: View order details after purchase
- **User Authentication**: Optional customer registration and login

### Admin Panel Features
- **Dashboard**: Overview of key metrics (orders, revenue, customers, low stock alerts)
- **Order Management**: 
  - View all orders with filters (status, payment, date range)
  - Update order status (Pending, Processing, Shipped, Delivered, Cancelled)
  - Manual payment confirmation
  - Export orders to CSV/JSON
  - Print order details
- **Customer Management**:
  - View customer list with search
  - View customer details and order history
  - Export customer data
- **Inventory Management**:
  - Add/Edit/Delete products
  - Update stock quantities
  - Low stock alerts
  - Category management
  - Export inventory data
- **Analytics & Reports**:
  - Sales charts (line, bar, doughnut)
  - Top products analysis
  - Sales by category
  - Order status distribution
  - Detailed sales reports
  - Export reports (CSV, JSON)

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: IndexedDB (browser-based, no installation needed)
- **Charts**: Chart.js (CDN)
- **No Backend Required**: All data stored locally in browser

## Getting Started

1. **Open the Website**: Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari)

2. **Default Admin Credentials**:
   - Username: `admin`
   - Password: `admin123`

3. **Access Admin Panel**: Click "Admin Panel" link in footer or navigate to `admin/index.html`

## File Structure

```
/
├── index.html              # Homepage/Product listing
├── product.html            # Product detail page
├── cart.html               # Shopping cart
├── checkout.html           # Checkout page
├── login.html              # Customer/Admin login
├── order-confirmation.html # Order confirmation
├── admin/
│   ├── index.html          # Admin dashboard
│   ├── orders.html         # Order management
│   ├── customers.html      # Customer management
│   ├── inventory.html      # Inventory management
│   ├── analytics.html     # Analytics & reports
│   ├── dashboard.js        # Dashboard logic
│   ├── orders.js          # Order management logic
│   ├── customers.js       # Customer management logic
│   ├── inventory.js       # Inventory management logic
│   └── analytics.js        # Analytics logic
├── css/
│   ├── style.css          # Main styles
│   ├── admin.css          # Admin panel styles
│   └── responsive.css     # Responsive styles
├── js/
│   ├── db.js              # IndexedDB setup & operations
│   ├── utils.js           # Utility functions
│   ├── auth.js            # Authentication system
│   ├── products.js        # Product management
│   └── cart.js            # Shopping cart functionality
└── README.md              # This file
```

## Usage Guide

### For Customers

1. **Browse Products**: Visit the homepage to see all products
2. **Filter by Category**: Click category buttons to filter products
3. **Search**: Use the search bar to find specific products
4. **View Product**: Click "View Details" to see full product information
5. **Add to Cart**: Click "Add to Cart" on product pages
6. **View Cart**: Click "Cart" in navigation to view cart items
7. **Checkout**: Click "Proceed to Checkout" to complete purchase
8. **Login (Optional)**: Create an account for faster checkout next time

### For Admins

1. **Login**: Go to login page and select "Admin Login" or add `?admin=true` to URL
2. **Dashboard**: View key metrics and recent orders
3. **Manage Orders**: 
   - View all orders
   - Filter by status, payment, or date
   - Update order status
   - Confirm payments manually
   - Export order data
4. **Manage Customers**: 
   - View customer list
   - Search customers
   - View customer details and order history
   - Export customer data
5. **Manage Inventory**:
   - Add new products
   - Edit existing products
   - Update stock quantities
   - Delete products
   - Export inventory data
6. **View Analytics**:
   - Select date range (Today, Week, Month, Year, All Time)
   - View sales charts and reports
   - Export reports

## Sample Data

The application comes pre-populated with sample products:
- Homemade soaps (Lavender, Rose Petal, Honey & Oatmeal, Tea Tree)
- Shikkakai powder (500g and 1kg)
- Grocery items (Turmeric, Cumin, Lentils, Basmati Rice)

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Edge
- Safari

**Note**: IndexedDB support is required. All modern browsers support this.

## Data Storage

All data is stored locally in your browser using IndexedDB. This means:
- No server required
- No database installation needed
- Data persists between sessions
- Data is browser-specific (different browsers = different data)

## Security Notes

- This is a demo application with client-side password hashing
- For production use, implement proper server-side authentication
- Admin credentials are stored in IndexedDB (not secure for production)
- All data is stored locally in the browser

## Export Features

All admin sections support data export:
- **CSV Export**: Download data as CSV files
- **JSON Export**: Download data as JSON files
- **Print**: Use browser print function for reports

## Payment Processing

- **Mock Payment**: Simulated payment for demo purposes
- **Manual Payment**: Admin can manually confirm payments in order management

## Support

For issues or questions, please refer to the code comments or contact the development team.

## License

This project is provided as-is for demonstration purposes.

