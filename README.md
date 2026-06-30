# MarketSquare E-Commerce API

A complete E-Commerce REST API built with Node.js, Express and MongoDB.

## Live URL

https://YOUR-APP-NAME.onrender.com

## Description

MarketSquare is an E-Commerce backend API that allows customers to browse
products, add to cart, place orders and make payments online.
Sellers can list products and admins can manage the entire platform.

## Tech Stack

- Node.js
- Express.js
- MongoDB and Mongoose
- JWT Authentication
- Paystack Payment
- Nodemailer Emails
- Cloudinary Image Upload
- Joi Validation

## How to Install and Run

Step 1 - Clone the project
git clone https://github.com/YOUR-GITHUB-USERNAME/YOUR-REPO-NAME.git

Step 2 - Go into the project folder
cd YOUR-REPO-NAME

Step 3 - Install packages
npm install

Step 4 - Create your .env file
cp .env.example .env
Then fill in your credentials

Step 5 - Start the server
npm run dev

Step 6 - Server runs on
http://localhost:5000

## Environment Variables Needed

PORT=5000
NODE_ENV=development
MONGO_URI=your mongodb connection string
JWT_SECRET=any long random text
JWT_EXPIRES_IN=10m
JWT_REFRESH_SECRET=any long random text
JWT_REFRESH_EXPIRES_IN=7d
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=your mailtrap username
EMAIL_PASS=your mailtrap password
PAYSTACK_SECRET_KEY=your paystack secret key
CLOUDINARY_CLOUD_NAME=your cloudinary cloud name
CLOUDINARY_API_KEY=your cloudinary api key
CLOUDINARY_API_SECRET=your cloudinary api secret
CLIENT_URL=http://localhost:3000

## API Endpoints

### Auth Routes

- POST /api/auth/register - Create account
- POST /api/auth/login - Login
- GET /api/auth/me - Get my profile
- POST /api/auth/forgot-password - Forgot password
- POST /api/auth/reset-password - Reset password
- POST /api/auth/otp/send - Send OTP
- POST /api/auth/otp/verify - Verify OTP
- POST /api/auth/logout - Logout

### Product Routes

- GET /api/products - Get all products
- GET /api/products/:id - Get one product
- GET /api/products/search - Search products
- POST /api/products - Create product (Seller)
- PATCH /api/products/:id - Update product (Seller)
- DELETE /api/products/:id - Delete product (Seller)

### Category Routes

- GET /api/categories - Get all categories
- POST /api/categories - Create category (Admin)
- PATCH /api/categories/:id - Update category (Admin)
- DELETE /api/categories/:id - Delete category (Admin)

### Cart Routes

- GET /api/cart - View cart
- POST /api/cart/add - Add to cart
- PATCH /api/cart/update/:productId - Update quantity
- DELETE /api/cart/remove/:productId - Remove item
- DELETE /api/cart/clear - Clear cart

### Order Routes

- POST /api/orders - Place order
- GET /api/orders/my-orders - My orders
- GET /api/orders/:id - Single order
- PATCH /api/orders/:id/cancel - Cancel order
- GET /api/orders - All orders (Admin)
- PATCH /api/orders/:id/status - Update status (Admin)

### Payment Routes

- POST /api/payments/initialize - Start payment
- GET /api/payments/verify/:reference - Verify payment
- POST /api/payments/webhook - Paystack webhook
- GET /api/payments - Payment history (Admin)

### Coupon Routes

- POST /api/coupons/validate - Validate coupon
- POST /api/coupons - Create coupon (Admin)
- GET /api/coupons - All coupons (Admin)
- DELETE /api/coupons/:id - Delete coupon (Admin)

### Inventory Routes

- GET /api/inventory - All inventory (Admin)
- GET /api/inventory/low-stock - Low stock alerts (Admin)
- PATCH /api/inventory/:productId/restock - Restock (Admin)

### Review Routes

- GET /api/reviews/product/:productId - Get reviews
- POST /api/reviews/product/:productId - Add review
- DELETE /api/reviews/:reviewId - Delete review

### Wishlist Routes

- GET /api/wishlist - Get wishlist
- POST /api/wishlist/:productId - Add or remove

## How to Use the API

1. Register an account using POST /api/auth/register
2. Login using POST /api/auth/login
3. Copy the accessToken from the response
4. Add it to your request header like this:
   Key: Authorization
   Value: Bearer YOUR_TOKEN_HERE
5. Now you can access protected routes

## User Roles

- customer - can shop, cart, orders, reviews, wishlist
- seller - can do everything customer can plus manage products
- admin - can manage everything on the platform
- superadmin - has full access including managing admins

## API Documentation

Link: YOUR POSTMAN COLLECTION LINK HERE

## Team Members

- DIMARIA - Backend Developer
- LOTA - Backend Developer
