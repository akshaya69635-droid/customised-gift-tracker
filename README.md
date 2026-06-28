# Paper Plane — Customised Gift Tracker

A premium, interactive workflow tracking system built for **Paper Plane**, a personalized gifting company. The application streamlines customization request submissions and tracks order stages from design receipt through to delivery.

👉 **Live Website:** [https://frontend-three-puce-68.vercel.app](https://frontend-three-puce-68.vercel.app)
👉 **API Docs:** [https://customised-gift-tracker-1.onrender.com/docs](https://customised-gift-tracker-1.onrender.com/docs)

## 📋 Table of Contents
- [Project Description](#-project-description)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation & Local Setup](#-installation--local-setup)
- [Live Links](#-live-links)
- [Team Members](#-team-members)

## 📖 Project Description
The **Customised Gift Tracker** is a full-stack platform that manages the lifecycle of custom gifting requests (e.g. customized engravings, card messages, packaging materials, and special instructions).

It separates workflows into two distinct views:
1. **Client Hub**: Enables users to register, log in, submit personalization requests with rich customization templates, and track the real-time status of their orders.
2. **Gift Studio (Staff Panel)**: Provides staff with a pipeline board to track order stages, configure SLA alerts, send corporate pricing proposals, track occasion calendars, and process return requests. It also integrates an AI engine that recommends products based on occasion type and recipient.

---

## 🛠️ Tech Stack
*   **Frontend**: React (v19), Vite, Tailwind CSS (v4)
*   **Backend**: FastAPI (Python 3.14+), SQLAlchemy ORM, Uvicorn
*   **Database**: PostgreSQL (Production), SQLite (Local development)
*   **Deployment**: Vercel (Frontend), Render (Backend & Database)

---

## 🚀 Installation & Local Setup

### Prerequisites
*   Node.js (v18+)
*   Python (3.9+)

### 1. Clone the Repository
```bash
git clone https://github.com/akshaya69635-droid/customised-gift-tracker.git
cd customised-gift-tracker
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   * **Windows**: 
     ```bash
     python -m venv .venv
     .venv\Scripts\activate
     ```
   * **macOS/Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```
   *The Swagger API documentation will be available at `http://localhost:8000/docs`.*

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser to view the application.*

---

## 🔗 Live Links
*   **Production Website (Frontend)**: [https://frontend-three-puce-68.vercel.app](https://frontend-three-puce-68.vercel.app)
*   **Production API Server (Backend)**: [https://customised-gift-tracker-1.onrender.com](https://customised-gift-tracker-1.onrender.com)
*   **Interactive API Docs (Swagger UI)**: [https://customised-gift-tracker-1.onrender.com/docs](https://customised-gift-tracker-1.onrender.com/docs)

---

## 👥 Team Members
*   **Akshaya** - Testing & Deployment
*   Harshith - Backend
*   Jahwanth - Frontend
