# Hybrid Nginx Load Balancer for Render + AWS EC2

This setup deploys a containerized **Nginx Load Balancer on Render** (as a Web Service) to distribute traffic across a hybrid backend cluster:
1. **AWS EC2 Backend Instance** (typically running Node.js / Express over HTTP on port 5000)
2. **Render Backend Service** (running as a Render Web Service over HTTPS on port 443, or a Render Private Service over HTTP on port 5000)

---

## Architecture

```text
               Internet Clients / Frontend SPA
                             │
                             ▼
              ┌─────────────────────────────┐
              │  Render Web Service (Nginx) │
              │      Port: $PORT (SSL)      │
              └──────────────┬──────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌────────────────────┐        ┌────────────────────┐
   │ Internal Forwarder │        │ Internal Forwarder │
   │   127.0.0.1:8081   │        │   127.0.0.1:8082   │
   └──────────┬─────────┘        └──────────┬─────────┘
              │                             │
    HTTP / custom port           HTTPS + SNI + Host Header
              │                             │
              ▼                             ▼
   ┌────────────────────┐        ┌────────────────────┐
   │   AWS EC2 Backend  │        │   Render Backend   │
   │   (e.g., :5000)    │        │  (*.onrender.com)  │
   └────────────────────┘        └────────────────────┘
```

### Why Internal Forwarders?
- **Mixed Protocols:** Nginx Open Source cannot mix `http://` and `https://` upstream targets inside a single `upstream` block. The internal forwarders adapt protocols locally at sub-millisecond speeds.
- **Render SNI & Host Header Requirements:** Render's public edge router requires the incoming `Host` header and TLS SNI to match the Render backend service hostname (e.g. `your-backend.onrender.com`). Without this, requests return `404 Not Found` or `502 Bad Gateway`. The Render forwarder sets these automatically.
- **Zero Downtime Failover:** If either the EC2 backend or the Render backend fails or times out, Nginx immediately and transparently retries the request on the healthy backend (`proxy_next_upstream`).

---

## Environment Variables

Configure these in the **Render Dashboard -> Environment** for your Nginx Web Service:

| Variable | Required | Default | Description |
|---|---|---|---|
| `EC2_BACKEND_HOST` | **Yes** | — | AWS EC2 public IP or DNS (e.g. `54.123.45.67` or `ec2-xx.compute.amazonaws.com`) |
| `EC2_BACKEND_PORT` | No | `5000` | Port where Express is listening on EC2 |
| `EC2_BACKEND_PROTOCOL` | No | `http` | Protocol to reach EC2 (`http` or `https`) |
| `RENDER_BACKEND_HOST` | **Yes** | — | Render backend hostname (e.g. `your-backend.onrender.com`) |
| `RENDER_BACKEND_PORT` | No | `443` for HTTPS / `5000` for HTTP | Port for Render backend |
| `RENDER_BACKEND_PROTOCOL` | No | `https` for `*.onrender.com` / `http` | Protocol to reach Render backend |
| `PORT` | Auto | `80` / `10000` | Injected automatically by Render for the Web Service |

> **Note:** Legacy environment variables `BACKEND_1_HOST`, `BACKEND_2_HOST`, and `BACKEND_PORT` are also supported for backwards compatibility.

---

## Step-by-Step Render Deployment Guide

### 1. Prepare Your AWS EC2 Backend
1. In the **AWS EC2 Console -> Security Groups**, ensure the inbound rule allows TCP on port `5000` (or your configured backend port) from `0.0.0.0/0`.
2. Ensure your backend Node server binds to `0.0.0.0` (not `localhost` / `127.0.0.1` only).
3. Note your EC2 Public IPv4 or Public IPv4 DNS name (e.g. `54.123.45.67`).

### 2. Prepare Your Render Backend
1. Deploy your backend as a **Web Service** on Render using the `/backend` directory.
2. Once deployed, note its public URL: `https://your-backend.onrender.com`.

### 3. Deploy This Load Balancer on Render
1. Open the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your repository.
4. Set the following options:
   - **Name:** `jobby-load-balancer` (or your preferred name)
   - **Root Directory:** `nginx-load-balancer`
   - **Runtime:** `Docker`
   - **Plan:** Free or Starter
5. Under **Environment Variables**, add:
   - `EC2_BACKEND_HOST`: `54.123.45.67` (your EC2 IP or DNS)
   - `EC2_BACKEND_PORT`: `5000`
   - `RENDER_BACKEND_HOST`: `your-backend.onrender.com`
6. Under **Advanced**:
   - **Health Check Path:** `/lb-health`
7. Click **Create Web Service**.

---

## Verification & Health Probes

Once deployed, use your Render Load Balancer URL (`https://<RENDER-LB-URL>`) to test:

### 1. Check Load Balancer Status
```bash
curl https://<RENDER-LB-URL>/lb-health
# {"status":"ok","lb":"active","platform":"render","targets":["ec2","render"]}
```

### 2. Direct Probe: EC2 Backend
```bash
curl https://<RENDER-LB-URL>/lb-health/ec2
# {"status":"ok","message":"JobGraph API is running"}
```

### 3. Direct Probe: Render Backend
```bash
curl https://<RENDER-LB-URL>/lb-health/render
# {"status":"ok","message":"JobGraph API is running"}
```

### 4. General Backend Cluster API Check
```bash
curl https://<RENDER-LB-URL>/api/health
```

---

## Local Docker Testing

To test this image locally before pushing to Render:

### In PowerShell (Windows):
```powershell
docker build -t jobby-load-balancer .
docker run --rm -p 8080:8080 `
  -e PORT=8080 `
  -e EC2_BACKEND_HOST=54.123.45.67 `
  -e EC2_BACKEND_PORT=5000 `
  -e RENDER_BACKEND_HOST=your-backend.onrender.com `
  jobby-load-balancer
```

### In Bash (macOS / Linux):
```bash
docker build -t jobby-load-balancer .
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e EC2_BACKEND_HOST=54.123.45.67 \
  -e EC2_BACKEND_PORT=5000 \
  -e RENDER_BACKEND_HOST=your-backend.onrender.com \
  jobby-load-balancer
```

Open `http://localhost:8080/lb-health` in your browser to verify.
