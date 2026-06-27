# SZN Marketplace Backend

## Overview

SZN Marketplace Backend is a RESTful API built with Node.js, Express.js, and MongoDB for a multi-vendor e-commerce platform.

The platform supports three user roles:

* **Super Admin** – Full control of the system.
* **Admin** – Manages products, approves sellers, and oversees marketplace operations.
* **Seller** – Customer who applied and was approved by admin, lists marketplace products.
* **Customer** - Default registration role; can purchase and apply to become a seller.

---

## Prerequisites 
* Node.js
* MongoDB Atlas cluster
* Cloudinary account (free tier works for development)
* Paystack account with test keys
* An SMTP email provider (Gmail App Password recommended for dev)

---

## Installation

Clone the repository

```
git clone <repository_url>
```

Install dependencies

```
npm install
```


Start the development server

```
npm run start
```

---

## Environment Setup
create a .env in the project root (see .env.example for all required variables). Never commit this file - it is already listed in .gitignore.

## Seed the SuperAdmin
Run this once after your first deployment to create the superadmin account from your .env values.

## Running the Server
npm start  - starts with nodemon
The server starts on the PORT defined in .env (default:6000). Visit http://localhost:6000 to confirm it is running.

## Paystack Webhook Setup
In your paystack dashboard go to settings-> Webhooks and add:
https://<your-domain>/api/payments/webhook
For local development use ngrok:
-then paste the ngrok HTTPS url into paystack dashboard

## Features

### Authentication

* User Registration
* Login
* Logout
* JWT Authentication
* Password Reset
* OTP Verification

### Users

* User Profile
* Update Profile
* Delete Account
* Role Management

### Products

* Create Product
* Update Product
* Delete Product
* Get Product
* Get All Products
* Product Categories
* Product Images (Cloudinary)

### Categories

* Create Category
* Update Category
* Delete Category
* View Categories

### Cart

* Add to Cart
* Update Cart
* Remove Item
* Clear Cart

### Wishlist

* Add to Wishlist
* Remove from Wishlist
* View Wishlist

### Reviews

* Create Review
* Update Review
* Delete Review
* Product Ratings

### Coupons

* Create Coupons
* Apply Coupons
* Validate Coupons

### Orders

* Create Order
* View Orders
* Update Order Status
* Cancel Order

### Inventory

* Stock Management
* Stock Updates

### Payments

* Payment Verification
* Payment Processing

---

## Folder Structure

```
config/
controllers/
middlewares/
models/
routes/
seed/
utils/
validation/
server.js
```

---

## API Modules

* Authentication
* Users
* Products
* Categories
* Cart
* Wishlist
* Reviews
* Coupons
* Orders
* Inventory
* Payments

---

## Security

* JWT Authentication
* Password Hashing
* Protected Routes
* Admin Authorization
* Input Validation
* Centralized Error Handling
* Helmet Security Headers
* Rate Limiting

---

## Request Auth
All protected emdpoints require a bearer token in the Authorization header. Access Tokens expire in JWT_EXPIRES_IN (default 10 minutes). use the refresh token cookie to obtain a new access token.

---

## Image Uploads
Product images endpoints accept multipart/form-data with the field name images. Up to 20 images per request,max 5MB each. Accepted formats:JPEG, PNG, WEBP.

## License

This project is intended for educational and portfolio purposes.