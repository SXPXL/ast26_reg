# Asthra Fest Registration Portal - Backend API

FastAPI-powered registration and event management backend with PostgreSQL, Cashfree Payment Gateway, JWT-based Role-Based Access Control (RBAC), and configurable `REQ_AUTH` toggle.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**:
   * **`ADMIN`**: Create/edit/delete events, create volunteers & assign to events, view global analytics and export CSV data.
   * **`VOLUNTEER`**: View assigned events, inspect participant teams, mark attendance (Check-in).
   * **`PARTICIPANT`**: View active events, register individual or team with teammates, initiate Cashfree PG payment session.

2. **Configurable Auth Switch (`REQ_AUTH`)**:
   * Set `REQ_AUTH=True` in `.env` to enforce strict JWT Bearer token authentication & role checks.
   * Set `REQ_AUTH=False` for local dev/testing without manual token headers.

3. **Cashfree Payment Gateway Integration**:
   * Automated order creation with `payment_session_id`.
   * Real-time payment verification endpoint (`/api/v1/payments/verify`) and webhook receiver (`/api/v1/payments/webhook`).

4. **Multi-member Team Registration**:
   * Min/Max team size validation per event.
   * Unique registration code generator (`ATHRA-2026-XXXXXX`).

---

## 🚀 Setup & Run Instructions

### 1. Prerequisites
* Python 3.10+
* PostgreSQL running locally or remotely (or SQLite for quick testing)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create or modify `.env` (a default `.env` is already created):
```env
REQ_AUTH=True
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/athra_fest_db
SECRET_KEY=your_secret_key_here
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENVIRONMENT=SANDBOX
```

### 4. Seed Default Admin & Sample Events
```bash
python scripts/seed_data.py
```
Default accounts created by seed script:
* **Admin**: `admin@fest.com` / `Admin@12345`
* **Volunteer**: `volunteer@fest.com` / `Volunteer@12345`

### 5. Start the FastAPI Server
```bash
uvicorn app.main:app --reload --port 8000
```

### 6. Start the React Frontend
Open a second terminal window:
```bash
cd frontend
npm run dev
```
Access the application at [http://localhost:5173](http://localhost:5173).

### 7. Interactive Swagger Documentation
Open your browser and navigate to:
* **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📡 API Endpoints Overview

| Module | Method | Endpoint | Access |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/login` | Public |
| **Auth** | `POST` | `/api/v1/auth/register` | Public / Admin |
| **Auth** | `GET` | `/api/v1/auth/me` | Authenticated |
| **Events** | `GET` | `/api/v1/events` | Public |
| **Events** | `GET` | `/api/v1/events/{id}` | Public |
| **Events** | `POST` | `/api/v1/events` | `ADMIN` |
| **Events** | `PUT` | `/api/v1/events/{id}` | `ADMIN` |
| **Events** | `DELETE` | `/api/v1/events/{id}` | `ADMIN` |
| **Events** | `POST` | `/api/v1/events/{id}/volunteers` | `ADMIN` |
| **Events** | `DELETE` | `/api/v1/events/{id}/volunteers/{user_id}` | `ADMIN` |
| **Volunteers** | `POST` | `/api/v1/volunteers` | `ADMIN` |
| **Volunteers** | `GET` | `/api/v1/volunteers` | `ADMIN` |
| **Volunteers** | `GET` | `/api/v1/volunteers/my-events` | `VOLUNTEER` |
| **Registrations** | `POST` | `/api/v1/registrations` | Public |
| **Registrations** | `GET` | `/api/v1/registrations/code/{code}` | Public |
| **Registrations** | `GET` | `/api/v1/registrations` | `ADMIN`, `VOLUNTEER` |
| **Registrations** | `GET` | `/api/v1/registrations/{id}` | `ADMIN`, `VOLUNTEER` |
| **Registrations** | `PATCH` | `/api/v1/registrations/{id}/attendance` | `ADMIN`, `VOLUNTEER` |
| **Payments** | `POST` | `/api/v1/payments/verify` | Public |
| **Payments** | `POST` | `/api/v1/payments/webhook` | Public |
| **Admin Stats** | `GET` | `/api/v1/admin/stats/overview` | `ADMIN` |
| **Admin Stats** | `GET` | `/api/v1/admin/stats/export/{event_id}` | `ADMIN` |
