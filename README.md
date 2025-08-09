
# 📰 News API (NestJS Backend)

A role-based RESTful API built with **NestJS**, designed for a news management platform. This system supports user authentication, article creation with image upload, category management, article views/likes tracking, and more.

---

## 📦 Features

- **User Roles**: Admin, Editor, User
- **Authentication**: JWT-based with role protection
- **CRUD Operations**:
  - Articles (with image upload & base64 storage)
  - Categories
- **Custom Features**:
  - Article view & like tracking
  - Admin-only article/category management
  - Base64 image handling with multer
- **Robust Validation & Guards**
- **MySQL Integration via TypeORM**

---


## 📽️ Demo Video

https://github.com/user-attachments/assets/58511fa8-6592-466e-92db-0154739abdb6

 ---

## 🚀 Tech Stack

- [NestJS](https://nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [MySQL](https://www.mysql.com/)
- [JWT](https://jwt.io/)
- [Multer](https://github.com/expressjs/multer)


---

## 🧪 API Endpoints

### 🔐 Auth (`/auth`)
- `POST /register` – Register a new user
- `POST /login` – Login and receive JWT
- `POST /register-admin?secretKey=XXXX` – Register an admin (secured)

### 📄 Articles (`/articles`)
- `POST /` – Create article (EDITOR/ADMIN only)
- `PUT /:id` – Update article
- `GET /` – Get published articles (USER/EDITOR/ADMIN)
- `GET /admin` – Get all articles (EDITOR/ADMIN)
- `GET /:id` – Get single article
- `POST /:id/view` – Increment view count
- `POST /:id/like` – Toggle like (auth only)
- `GET /:id/like-status` – Get like status for logged-in user
- `DELETE /:id` – Delete article (EDITOR/ADMIN)

### 🗂️ Categories (`/categories`)
- `POST /` – Create category (EDITOR/ADMIN)
- `GET /` – Get all categories
- `GET /:id` – Get single category
- `PUT /:id` – Update category (EDITOR/ADMIN)
- `DELETE /:id` – Delete category (ADMIN only, if no articles)

---

## 🧾 DTOs and Validation

- Strong validation using `class-validator`
- Clear separation between `Create` and `Update` DTOs
- Optional fields handled gracefully

---

## 🔒 Role-Based Access

The app uses two guards:
- `JwtAuthGuard`: Verifies JWT token
- `RolesGuard`: Verifies user role (ADMIN, EDITOR, USER)

You can set roles via the `@Roles(...)` decorator.

---

## Database Schema

<img width="1986" height="3840" alt="Untitled diagram _ Mermaid Chart-2025-08-07-181828" src="https://github.com/user-attachments/assets/0dd54c99-dc5d-4b32-a40c-50c66eea62e5" />

---

## JWT Authentication

<img width="3840" height="2550" alt="Untitled diagram _ Mermaid Chart-2025-08-07-181903" src="https://github.com/user-attachments/assets/68683a83-ec25-4c85-aa14-cfffc3f28bff" />

---

## ✅ Running the App

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
cp .env.example .env  # then edit the .env

# 3. Run development server
npm run start:dev

```
---

## 🌐 App URL

http://localhost:3000

---

## 🧪 Testing

Run unit tests:

```bash
npm run test
```
---

## 📌 Notes
- CORS is enabled for http://localhost:3001 (frontend origin)
- Image handling uses multer with diskStorage and deletes file after base64 encoding
- ValidationPipe and ExceptionFilter configured globally in main.ts

---

## 👨‍💻 Author
Vihanga Jayasuriya 

---
## 📄 License
- This project is licensed under the MIT License.
- © 2025 Vihanga Jayasuriya. All Rights Reserved.

---



