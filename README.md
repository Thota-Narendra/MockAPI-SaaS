# MockAPI: Enterprise SaaS Platform 🚀

**MockAPI** is a secure, multi-tenant microservice platform that eliminates frontend development blockers by providing highly dynamic and stateful mock APIs. It empowers cross-functional teams to test application resilience, integrate faster, and accelerate parallel development.

---

## 🌟 Core Features & Value Proposition

MockAPI goes beyond simple static JSON mocks — it provides stateful, intelligent, and observable mock APIs suited for real-world enterprise needs.

| Feature | Technology Stack | Value to Engineers |
|----------|------------------|--------------------|
| **Real-Time Inspection** | FastAPI WebSockets + Redis Pub/Sub | View every request hitting your mock API in real-time, directly in the Live DevTools panel for faster debugging and testing. |
| **Stateful Mocks** | Redis Lists / Keys | Your mocks have "memory": data created via `POST /users` can be retrieved later via `GET /users`. |
| **Dynamic Data** | Python Faker Library | Generate realistic, unique, and dynamic data (names, emails, addresses, etc.) with simple variable syntax like `{{Faker.name()}}`. |
| **Chaos Engineering** | Python asyncio + random | Stress test your client apps using latency simulation (`delay_ms`) or probabilistic failures (`failure_rate`). |
| **Multi-Tenancy / RBAC** | PostgreSQL + JWT Auth | Separate organizations, projects, and roles (Owner, Admin, Editor, Viewer) for secure, scalable collaboration. |

---

## 🏗️ System Architecture Overview

The platform follows a **scalable microservice** pattern with asynchronous APIs and Redis-based real-time messaging.  

### Architecture Components

| Component | Port | Role | Core Technologies |
|------------|------|------|-------------------|
| **Manager API** | `8000` | Authentication & Administration. Handles users, organizations, projects, and WebSocket-based live log streaming. | FastAPI, MySQL, Redis Pub/Sub |
| **Mock Engine** | `8001` | Data service for mock endpoint execution — applies Faker logic, chaos simulation, and state persistence. | FastAPI, Redis, SQLAlchemy |
| **Frontend UI** | `3000` | Dynamic configuration interface and live inspection dashboard. | React, Axios, React Router |
| **Database** | `3306` | Stores organizational data, project settings, and endpoint definitions. | MySQL (PostgreSQL/MariaDB compatible) |

---

## ⚙️ Technical Highlights

- Asynchronous event-driven architecture using **Redis Pub/Sub** for instant backend communication.
- Modular microservice design: Manager API and Mock Engine can scale independently.
- Backend written entirely in **FastAPI** for high performance and low latency.
- Dynamic, data-driven configuration via REST and WebSocket endpoints.
- Secure JWT authentication with per-organization RBAC enforcement.
- Full developer observability through **live request/response tracking**.

---

## 🚀 Local Setup Guide (Windows One-Click)

Requirements:
- **Git**
- **MySQL Server**
- **Redis Server** (running as a Windows service)
- **Node.js (LTS)** for frontend
- **Python 3.10+** for backend services

### 1. Setup

Clone the repository and enter the project:

```
git clone https://github.com/Thota-Narendra/MockAPI-SaaS
cd MockAPI-SaaS
```
Configuration for **JWT authentication**:

Create a `.env` file inside `backend/manager-api`:

backend/manager-api/.env
``` 
SECRET_KEY="YOUR_LONG_RANDOM_SECURE_SECRET"
```

Ensure your MySQL database (`mockapi_db`) exists and is empty — the backend will handle table creation automatically.

---

### 2. Execution

From the **project root directory**, start all services using the master script

## Start.bat:


The batch script will automatically open **three Command Prompt** windows:

1. **Manager API** (bootstraps DB and runs on port `8000`)
2. **Mock Engine** (runs mock data server on port `8001`)
3. **React Frontend** (runs dev server on port `3000`)

---

### 3. Access Points

| Service | URL | Description |
|----------|-----|-------------|
| Frontend UI | [http://localhost:3000](http://localhost:3000) | Register a new user and log in. |
| API Manager | [http://localhost:8000/docs](http://localhost:8000/docs) | Access FastAPI Swagger Interface. |
| Live Testing | Create endpoints in your project page | Use the generated mock URL for live data testing. |

---

## 🧩 Example Use Case

1. Create a project named **User Management** in the dashboard.  
2. Add a new mock endpoint `/users`.  
3. Define a POST request that stores user payloads and a GET that returns all users.  
4. Enable **chaos mode** to simulate latency.  
5. Observe real-time request logs in the Live Inspector panel.

---

## 🔒 Security & Scalability

- JWT-based per-session encryption and token signing.
- Project and user-level isolation for secure, multi-tenant usage.
- Cluster-ready architecture for horizontal scaling (Docker/Kubernetes ready).
- Optional HTTPS/SSL configuration through React proxy settings or reverse proxy (Nginx).

---

## 🧠 Future Enhancements (Planned Roadmap)

- REST endpoint templates import/export in YAML format.
- WebSocket subscription for client-side mock state syncing.
- Role-based analytics dashboard for project admins.
- Integration with external observability tools (Grafana, Loki).
- One-click Docker Compose deployment.

---

## 🤝 Contributing

Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a feature branch (`feature/new-enhancement`).
3. Commit your changes with clear messages.
4. Submit a pull request for review.

---

## 📬 Support

For issues, suggestions, or feature requests, please open an **Issue** in the repository or contact the maintainer via **Discussions**.

---

**MockAPI: Build, Test, and Ship Without Back-End Blockers.**
