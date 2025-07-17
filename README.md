# Lottery Management System

A comprehensive web application built for managing lottery operations, designed specifically for lottery vendors and shop owners. The system streamlines lottery business management through secure user authentication, shop management, daily transaction recording, and multi-day order planning for both NLB (National Lottery Board) and DLB (Development Lottery Board) lotteries.

## 🔧 Technologies Used

```javascript
technologies: [
  'Next.js', 
  'React', 
  'JavaScript', 
  'MySQL', 
  'JWT Authentication', 
  'Tailwind CSS',
  'Node.js',
  'REST APIs',
  'Bcrypt',
  'Nodemailer'
]
```

## 🎯 Project Highlights

- **Multi-tenant Architecture:** Supports multiple shops under single user account
- **Real-time Analytics:** Live dashboard with financial summaries and unbalanced record alerts
- **Data Integrity:** Automatic balance validation and error detection
- **User Experience:** Intuitive dashboard with quick access navigation
- **Scalability:** Built with Next.js for easy deployment and scaling

A robust web application built with **Next.js** and **MySQL** to manage lottery operations. This system lets you track shops, record daily lottery transactions, manage orders for the next three days, and handle user authentication—all wrapped in a user-friendly, secure, and responsive interface.

---

## 📋 Overview

The **Lottery Management System** is your go-to tool for streamlining lottery-related tasks. Whether you're adding or removing shops, keeping daily records of lottery sales, or planning orders for NLB and DLB lotteries, this app has you covered. It’s built for vendors who need an efficient way to manage their operations.

### Key Features
- **🔐 Authentication System**
  - Secure JWT-based login with email password reset functionality
  - HTTP-only cookies for enhanced session security
  - Bcrypt password hashing for secure credential storage

- **🏪 Shop Management**
  - Add, edit, and manage multiple lottery shops with contact details
  - Store comprehensive business information including name, contact, and address
  - CRUD operations with data validation

- **📊 Daily Lottery Records**
  - Comprehensive daily transaction logging with financial analytics
  - Record specifics like price per lottery, quantity, total worth, cash given, tickets returned, and special notes
  - Real-time balance checking and error detection
  - Support for both NLB and DLB lottery types with separate tracking

- **📋 Order Management**
  - Plan lottery orders for the next three days in advance
  - Separate tables for NLB (National Lottery Board) and DLB (Development Lottery Board)
  - Edit orders with save and cancel options
  - Automatic date progression for seamless planning

- **💰 Financial Analytics**
  - Real-time calculation of profits, losses, and unbalanced records
  - Comprehensive reporting with ticket counts and revenue tracking
  - Balance verification and discrepancy alerts
  - Loan tracking and financial summaries

- **🎫 Dual Lottery Support**
  - Complete management for both NLB and DLB lottery systems
  - Category-specific data handling and reporting
  - Separate analytics and order management

- **📱 Database Integration**
  - MySQL-powered with optimized database schema
  - Connection pooling for reliable performance
  - API routes to fetch and update data smoothly
  - Automated backup and data integrity checks

- **🎨 UI/UX**
  - Responsive layout with modern Tailwind CSS styling
  - Side-by-side NLB and DLB tables for easy comparison
  - Loading indicators and error messages for seamless experience
  - Mobile-friendly interface with intuitive navigation
  - Real-time dashboard with personalized greetings

- **🔒 Security**
  - JWT tokens for authentication with HTTP-only cookies
  - Bcrypt password hashing for secure credential storage
  - Environment-based configuration for sensitive data protection
  - SSL certificate integration for secure connections

## 🏗️ Technical Implementation

### **Frontend Architecture**
- **Next.js 15** with React 19 for server-side rendering and optimal performance
- **Tailwind CSS** for responsive and modern design system
- **Component-based architecture** with reusable UI components
- **Client-side state management** with React hooks

### **Backend Infrastructure**
- **Next.js API routes** with serverless architecture
- **RESTful API design** for clean data operations
- **Middleware integration** for authentication and validation
- **Error handling** with comprehensive logging

### **Database Design**
- **MySQL** with optimized schema design
- **Connection pooling** for reliable data storage and performance
- **Relational data modeling** with proper foreign key constraints
- **Data validation** at both client and server levels

### **Security Implementation**
- **JWT tokens** with HTTP-only cookies for enhanced security
- **Bcrypt password hashing** for secure credential storage
- **Environment-based configuration** for sensitive data
- **SSL certificate integration** for secure connections

### **Core Functionalities**
1. **Dashboard:** Personalized greeting with system status and quick access cards
2. **Shop Management:** CRUD operations for lottery shop information
3. **Daily Records:** Transaction logging with NLB/DLB breakdown and financial tracking
4. **Order Planning:** 3-day advance ordering system with editable quantities
5. **Analytics:** Comprehensive reporting with ticket counts, revenue tracking, and balance verification

### **Database Schema**
- **Users table:** Authentication credentials and user profiles
- **Shops table:** Business information and contact details
- **Lottery types:** NLB/DLB categorization with pricing
- **Orders table:** Advance planning and quantity management
- **Daily records:** Transaction history and financial data
- **Loan records:** Financial tracking and credit management

## 💼 Business Value

This system digitizes traditional lottery business operations, reducing manual errors, providing real-time financial insights, and streamlining daily workflows for lottery vendors. It ensures accurate record-keeping and helps business owners make data-driven decisions through:

- **Automated Calculations:** Eliminates manual arithmetic errors
- **Real-time Monitoring:** Instant alerts for unbalanced transactions
- **Historical Data:** Comprehensive reporting for business analysis
- **Scalable Operations:** Support for multiple shops and lottery types
- **Financial Transparency:** Clear profit/loss tracking and audit trails

---

## 🚀 Getting Started

### Prerequisites
You’ll need these installed:
- **Node.js** (v16 or higher)
- **MySQL** (v5.7 or higher)
- **Git** (to clone the repo)

### Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/lottery-management-system.git
   cd lottery
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   npm run dev
   ```
   

3. **Set Up the Database**:
   - Create a MySQL database called `lottery_db`.
   - Run this SQL to set up the tables:
     ```sql
     CREATE TABLE users (
         id INT AUTO_INCREMENT PRIMARY KEY,
         gmail VARCHAR(255) UNIQUE NOT NULL,
         password VARCHAR(255) NOT NULL,
         name VARCHAR(100)
     );

     CREATE TABLE shops (
         id INT AUTO_INCREMENT PRIMARY KEY,
         name VARCHAR(100) NOT NULL,
         contact_number VARCHAR(20),
         address TEXT
     );

     CREATE TABLE lottery_types (
         id INT AUTO_INCREMENT PRIMARY KEY,
         name VARCHAR(100) NOT NULL,
         category ENUM('NLB', 'DLB') NOT NULL
     );

     CREATE TABLE orders (
         id INT AUTO_INCREMENT PRIMARY KEY,
         shop_id INT NOT NULL,
         lottery_type_id INT NOT NULL,
         quantity INT DEFAULT 0,
         FOREIGN KEY (shop_id) REFERENCES shops(id),
         FOREIGN KEY (lottery_type_id) REFERENCES lottery_types(id),
         UNIQUE KEY unique_order (shop_id, lottery_type_id)
     );

     CREATE TABLE daily_records (
         id INT AUTO_INCREMENT PRIMARY KEY,
         shop_id INT NOT NULL,
         date DATE NOT NULL,
         price_per_lottery DECIMAL(10,2) NOT NULL,
         lottery_quantity INT NOT NULL,
         total_worth DECIMAL(10,2),
         cash_given DECIMAL(10,2),
         tickets_returned INT,
         special_notes TEXT,
         FOREIGN KEY (shop_id) REFERENCES shops(id)
     );
     ```

4. **Configure Environment Variables**:
   - Create a `.env.local` file in the root directory:
     ```env
     DB_HOST=localhost
     DB_USER=your_username
     DB_PASS=your_password
     DB_NAME=lottery_db
     JWT_SECRET=your_jwt_secret
     ```

5. **Run the Application**:
   ```bash
   npm run dev
   ```
   - Open it at `http://localhost:3000`.

---

## 🖥️ Usage
![image](https://github.com/user-attachments/assets/3cebe9fe-a795-4c32-a653-a8bb95eaaf18)

### 1. **Login**
- Sign in with your Gmail and password. Use the “Forgot Password” link to reset via email if needed.
![image](https://github.com/user-attachments/assets/425207aa-c3d6-400e-b2ae-759ddad97176)

### 2. **Manage Shops**
- Head to the dashboard to add, edit, or remove shops. Fill in details like name, contact, and address.
![image](https://github.com/user-attachments/assets/575bb735-e28b-438d-9700-4b14c6c62504)

### 3. **Daily Records**
- Go to “Lottery Records” to log daily transactions for each shop—price, quantity, cash, returns, and notes.
![2025-04-15 02 06 04](https://github.com/user-attachments/assets/1aea94c9-e6db-4560-afd9-b362ac1def6a)

- records
![image](https://github.com/user-attachments/assets/233878c0-d019-41c1-ab55-a680adfc9122)

### 4. **Order Management**
- Visit “Orders” to schedule lottery orders for the next three days.
![image](https://github.com/user-attachments/assets/9746b72b-d0e9-4b95-b411-1af3153d7355)

- Edit NLB and DLB quantities in their respective tables, then save or cancel your changes.
![image](https://github.com/user-attachments/assets/924541db-1567-4708-8574-07c461b78df6)

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MySQL with connection pooling
- **Authentication**: JWT, HTTP-only Cookies, Bcrypt
- **Additional**: Nodemailer, React Icons, ESLint

## 🚀 Deployment & Performance
- **Optimized Build:** Next.js production build with Turbopack
- **SSL Integration:** Secure certificate management
- **Environment Configuration:** Development and production settings
- **Database Optimization:** Connection pooling for efficiency
- **Performance Monitoring:** Real-time system status tracking

---

## 🤝 Contributing
Want to help out? Here’s how:
1. Fork the repo.
2. Create a branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push it (`git push origin feature/your-feature`).
5. Open a Pull Request.

---


---

## 📬 Contact
Got questions? Hit me up:
- **GitHub**: [IllangasingheIMDP](https://github.com/IllangasingheIMDP)
- **Email**: dasunpramodya616@gmail.com

---

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

⭐ **Give this repo a star** if it’s useful to you! ⭐
