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

3. **Pluggable Payment Gateway Architecture**:
   * Standardized provider interface (`app/services/payments/`) allowing zero-code switching between gateways via `PAYMENT_PROVIDER` in `.env`:
     * **`razorpay`** (Default): Razorpay standard checkout with HMAC-SHA256 signature verification and idempotent webhook handling (`payment.captured`, `payment.failed`, `order.paid`).
     * **`cashfree`**: Cashfree Payment Gateway integration adapter with payment session ID and verification.
     * **`manual_upi`**: Direct UPI QR / VPA payment with 12-digit UTR submission and admin/volunteer manual review (`PENDING_MANUAL`).
     * **`manual`**: Pay-at-Desk mode (`PAYMENT_PROVIDER=manual` or `PAYMENT_MODE=manual`). Disables all online gateways; participants register and are instructed to pay at the event payment desk, and volunteers confirm payments live via the **Verify Payments** WebSocket portal.
   * Never trusts client status alone: registrations transition to `PAID` exclusively via server-side signature verification or verified webhooks.

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

# Payment Provider: "razorpay" (default), "cashfree", or "manual_upi"
PAYMENT_PROVIDER=razorpay

# Razorpay Credentials (required when PAYMENT_PROVIDER=razorpay)
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# Manual UPI Direct Transfer Settings (fallback when PAYMENT_PROVIDER=manual_upi)
MANUAL_UPI_ID=asthra26@upi
MANUAL_UPI_NAME=Asthra 26 Mathematics Dept
```

### 4. Razorpay Webhook Setup
In your [Razorpay Dashboard](https://dashboard.razorpay.com/):
1. Navigate to **Account & Settings** > **Webhooks** > **Add New Webhook**.
2. **Webhook URL**: `https://<YOUR_BACKEND_URL>/api/v1/payments/webhook`
3. **Secret**: Enter the exact string set in your `RAZORPAY_WEBHOOK_SECRET` environment variable.
4. **Active Events**: Check:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
5. Save Webhook. Razorpay sends an HMAC-SHA256 signature in the `X-Razorpay-Signature` header, which the backend verifies over the raw request body.

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
