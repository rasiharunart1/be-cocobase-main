# Cocobase Backend

This is a **Node.js** application using **Express.js** framework and **Prisma ORM**.

## Tech Stack (Laravel Analogy)

| Feature | This Project (Node.js) | Laravel Equivalent |
| :--- | :--- | :--- |
| **Language** | JavaScript | PHP |
| **Framework** | Express.js | Laravel |
| **ORM (Database)** | Prisma | Eloquent |
| **Package Manager** | npm | Composer |
| **Entry Point** | `app.js` | `public/index.php` |
| **Routes** | `routes/` | `routes/web.php` or `api.php` |
| **Controllers** | `controllers/` | `app/Http/Controllers/` |

## How to Run Locally

### 1. Prerequisites
- Node.js installed (v16+ recommended).
- PostgreSQL database installed and running.

### 2. Setup
1.  **Clone/Open** the project.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Configuration**:
    - Copy `.env.example` to `.env`.
    ```bash
    cp .env.example .env
    ```
    - Open `.env` and update `DATABASE_URL` with your local PostgreSQL credentials:
      `postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME?schema=public`

### 3. Database Migration
Since this uses Prisma, you need to sync your database with the schema.
```bash
npx prisma migrate dev --name init
```
*This is similar to `php artisan migrate`.*

### 4. Start Server
Run the development server (uses `nodemon` for hot reloading):
```bash
npm run dev
```
*This is similar to `php artisan serve`.*
