# Flower Shop - Full Stack E-commerce Application

A beautiful flower shop e-commerce application built with React, Node.js, Express, and MongoDB.

## Features

### Customer Features
- Browse products by category
- Product search and filtering
- Shopping cart functionality
- User registration and authentication
- Checkout process
- Order history
- Product reviews

### Admin Features
- Dashboard with statistics
- Product management (CRUD)
- Category management
- Order management
- User management

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Zustand for state management
- React Hook Form for forms
- React Hot Toast for notifications

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. Clone the repository

2. Install Frontend dependencies:
```bash
cd frontend
npm install
```

3. Install Backend dependencies:
```bash
cd backend
npm install
```

4. Configure environment variables:
```bash
# Copy example env file
cp backend/.env.example backend/.env

# Edit the .env file with your settings
```

5. Seed the database:
```bash
cd backend
npm run seed
```

6. Start the development servers:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Test Accounts

After running the seed command:

- **Admin:** admin@flowerbloom.com / admin123
- **User:** user@example.com / user123

## Project Structure

```
flower-shop/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── ...
│
└── backend/
    ├── src/
    │   ├── models/        # MongoDB models
    │   ├── routes/        # API routes
    │   ├── middleware/    # Express middleware
    │   └── seeds/         # Database seeders
    └── ...
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:slug` - Get product by slug
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug` - Get category with products
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status (Admin)
- `PUT /api/orders/:id/cancel` - Cancel order

### Reviews
- `GET /api/reviews` - Get all reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

## License

MIT
