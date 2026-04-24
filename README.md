# 🚗 Car Sale Project

A full-stack car marketplace web application built with the **MERN stack**, featuring JWT authentication, AWS S3 image hosting, containerised deployment, and an automated CI/CD pipeline.

> **Live repo:** [github.com/Bhhgtr/Car-Sale-Project](https://github.com/Bhhgtr/Car-Sale-Project)

---

## 🔍 Project Overview

This project demonstrates end-to-end ownership of a production-style web application — from REST API design and database modelling through to containerised deployment and automated testing. It simulates a real-world car sales platform where users can list, browse, and manage vehicle listings.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite), JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Atlas / Local) |
| **Authentication** | JWT (JSON Web Tokens) |
| **File Storage** | AWS S3 |
| **Containerisation** | Docker, Docker Compose |
| **Testing** | Vitest |
| **Code Quality** | ESLint, Husky (pre-commit hooks) |
| **CI/CD** | GitHub Actions |
| **Deployment** | AWS EC2, Nginx, Docker |

---

## ✨ Key Features

- **User authentication** — secure JWT-based registration and login flow
- **Car listings** — full CRUD operations for vehicle listings
- **Image uploads** — car photos stored and served via AWS S3
- **Monorepo architecture** — clean separation of `api/` (backend) and `client/` (frontend) within a single repository
- **Containerised** — multi-stage Dockerfile builds the React app and bundles it with the Express server; Docker Compose orchestrates the full stack in one command
- **Automated testing** — unit/integration tests via Vitest
- **CI/CD pipeline** — GitHub Actions workflow automates linting, testing, and build checks on every push
- **Pre-commit hooks** — Husky enforces code quality gates before commits land
- **Swagger** — Interactive OpenAPI documentation 

---

## 🏗️ Architecture

```
Car-Sale-Project/
├── api/              # Express REST API (routes, controllers, models, middleware)
├── client/           # React + Vite frontend (SPA)
├── .github/
│   └── workflows/    # GitHub Actions CI/CD pipeline
├── Dockerfile        # Multi-stage build (React → Express)
├── docker-compose.yml
└── .env.example      # Environment variable reference
```

The app follows a classic **client–server** pattern: the React SPA communicates with the Express API over REST, the API persists data in MongoDB, and user-uploaded images are offloaded to AWS S3. In production the entire stack is packaged into a single Docker image served on port 3000.

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- Docker & Docker Compose (for containerised setup)
- MongoDB Atlas URI or local MongoDB instance
- AWS S3 bucket (optional — only required for image uploads)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Bhhgtr/Car-Sale-Project.git
cd Car-Sale-Project

# 2. Set up environment variables
cp .env.example .env
# Fill in MONGO, JWT_SECRET, and (optionally) AWS credentials

# 3. Install dependencies
npm install
cd client && npm install && cd ..

# 4. Start the API and client
npm run dev          # starts Express API
cd client && npm run dev   # starts Vite dev server on :5173
```

### Docker (recommended)

```bash
cp .env.example .env   # configure your .env first
docker-compose up --build
# App available at http://localhost:3000
```

---

## 🧪 Testing

```bash
npm test       # runs Vitest test suite
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and populate the values:

| Variable | Description |
|---|---|
| `MONGO` | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `AWS_REGION` | AWS region for S3 (e.g. `ap-south-1`) |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_BUCKET_NAME` | S3 bucket name for image storage |
| `CLIENT_URL` | Frontend origin (e.g. `http://localhost:5173`) |

---

## 💡 Engineering Highlights

- **Multi-stage Docker build** — keeps the production image lean by compiling the React app in a build stage and copying only the static assets into the runtime image
- **Husky pre-commit hooks** — ESLint runs automatically before every commit, preventing style/lint regressions from reaching the remote
- **GitHub Actions CI** — automated pipeline validates every push, giving confidence that the main branch is always in a deployable state
- **Separation of concerns** — the monorepo structure cleanly isolates frontend and backend concerns while sharing a single deployment unit

---

## ☁️ Deployment (AWS EC2 + Docker + Nginx)

The application is deployed on an **AWS EC2** instance, with **Nginx** acting as a reverse proxy in front of the Dockerised app.

### Infrastructure Overview

```
Internet
   │
   ▼
[ Nginx :80/:443 ]   ← reverse proxy on EC2
   │
   ▼
[ Docker container :3000 ]   ← Express + React static build
   │
   ▼
[ MongoDB Atlas ]   ← managed cloud database
[ AWS S3 ]          ← image storage
```

### EC2 Setup

```bash
# 1. SSH into your EC2 instance (Amazon Linux 2 / Ubuntu)
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# 2. Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose
sudo systemctl enable docker && sudo systemctl start docker
sudo usermod -aG docker $USER  # allow running docker without sudo

# 3. Install Nginx
sudo apt install -y nginx
```

### Deploy the App

```bash
# 1. Clone the repo onto the instance
git clone https://github.com/Bhhgtr/Car-Sale-Project.git
cd Car-Sale-Project

# 2. Configure environment variables
cp .env.example .env
nano .env   # fill in MONGO, JWT_SECRET, AWS credentials, CLIENT_URL

# 3. Build and start the container
docker-compose up -d --build
# App is now running on http://localhost:3000 inside the instance
```

### Nginx Configuration

Create a reverse proxy config so Nginx forwards public traffic to the Docker container:

```nginx
# /etc/nginx/sites-available/car-sale
server {
    listen 80;
    server_name your-domain.com;   # or your EC2 public IP

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site and reload Nginx
sudo ln -s /etc/nginx/sites-available/car-sale /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### EC2 Security Group

Ensure the following inbound rules are set in your EC2 Security Group:

| Type | Port | Source |
|---|---|---|
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| SSH | 22 | Your IP only |

> **TLS/HTTPS:** Use [Certbot](https://certbot.eff.org/) with the Nginx plugin to provision a free Let's Encrypt certificate for your domain.

---

## 👤 Author

**Buthsara Hirimuthugoda**
[github.com/Bhhgtr](https://github.com/Bhhgtr)

---

## 👤 Support

If you find this project useful, please consider giving it a ⭐ on GitHub.
