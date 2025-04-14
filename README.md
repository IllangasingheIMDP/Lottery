# Lottery Management System


A robust web application built with **Next.js** and **MySQL** to manage lottery operations. This system lets you track shops, record daily lottery transactions, manage orders for the next three days, and handle user authentication—all wrapped in a user-friendly, secure, and responsive interface.

---

## 📋 Overview

The **Lottery Management System** is your go-to tool for streamlining lottery-related tasks. Whether you're adding or removing shops, keeping daily records of lottery sales, or planning orders for NLB and DLB lotteries, this app has you covered. It’s built for vendors who need an efficient way to manage their operations.

### Key Features
- **User Authentication**
  - Log in securely with your Gmail and password.
  - Forgot your password? Reset it via email.

- **Shop Management**
  - Add, remove, or edit shops.
  - Store details like shop name, contact number, and address.

- **Daily Lottery Records**
  - Enter and track daily records for each shop.
  - Record specifics like price per lottery, quantity, total worth, cash given, tickets returned, and special notes.

- **Order Management**
  - Plan lottery orders for the next three days.
  - Separate tables for NLB (National Lottery Board) and DLB (Development Lottery Board).
  - Edit orders with save and cancel options.

- **Database Integration**
  - MySQL-powered with tables for users, shops, lottery types, orders, and daily records.
  - API routes to fetch and update data smoothly.

- **UI/UX**
  - Responsive layout with side-by-side NLB and DLB tables.
  - Loading indicators and error messages for a seamless experience.

- **Security**
  - JWT tokens for authentication.
  - HTTP-only cookies to keep your sessions secure.

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
- **Frontend**: Next.js, React
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Authentication**: JWT, HTTP-only Cookies
- **Styling**: CSS (room to add Tailwind CSS)

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
