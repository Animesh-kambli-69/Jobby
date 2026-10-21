  # AWS EC2 Backend Deployment Guide (Jobby / JobGraph)

Complete, step-by-step instructions for deploying and running the **Jobby** Express.js backend on an **AWS EC2** instance, with automated process management (PM2) and integration with the Render Nginx Load Balancer.

---

## 📋 Server & Architecture Summary

| Property | Value |
| :--- | :--- |
| **Server Elastic IP** | `3.107.75.32` |
| **Backend Runtime** | Node.js 20 LTS (ES Modules) |
| **Internal Port** | `5000` |
| **Process Manager** | PM2 |
| **Health Check Endpoint** | `http://3.107.75.32:5000/api/health` |
| **Nginx Load Balancer** | Hosted on Render (routes traffic between EC2 & Render) |

---

## 🔑 Prerequisites

Before starting, ensure you have:
1. **Your AWS `.pem` Key Pair file** (e.g., `my-first-key.pem` in `Downloads`).
2. **MongoDB Atlas URI** (connection string with database credentials).
3. **Groq API Key** ([console.groq.com/keys](https://console.groq.com/keys)).
4. **Cloudinary Credentials** (Cloud Name, API Key, API Secret).
5. **JWT Secret** (any secure secret string).

---

## 🚀 Step 1: Connect to EC2 from Windows Terminal

### 1.1 Fix Windows Key Permissions (Run Once in Command Prompt / PowerShell)
Navigate to the directory where your `.pem` key is saved (e.g., `Downloads`):

```cmd
cd C:\Users\Ani\Downloads
icacls "my-first-key.pem" /reset
icacls "my-first-key.pem" /inheritance:r
icacls "my-first-key.pem" /grant:r %USERNAME%:R
```

### 1.2 SSH into the Instance

- **For Amazon Linux** (default AWS AMI):
  ```cmd
  ssh -i "my-first-key.pem" ec2-user@3.107.75.32
  ```

- **For Ubuntu**:
  ```cmd
  ssh -i "my-first-key.pem" ubuntu@3.107.75.32
  ```

*Type `yes` when prompted to confirm the host authenticity.*

---

## 📦 Step 2: Install Node.js 20 & Git on EC2

Once logged into your EC2 terminal, run:

### For Amazon Linux (dnf):
```bash
# Update packages and install Git
sudo dnf update -y && sudo dnf install -y git curl

# Install Node.js 20 LTS from NodeSource
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verify installations
node -v   # Should output v20.x.x
npm -v    # Should output v10.x.x
```

### (If using Ubuntu):
```bash
sudo apt update -y && sudo apt upgrade -y
sudo apt install -y git curl build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 📂 Step 3: Clone Repository & Install Dependencies

```bash
# 1. Clone your repository
git clone https://github.com/<your-username>/<your-repo-name>.git

# 2. Enter the backend directory
cd <your-repo-name>/backend

# 3. Install production dependencies
npm install --omit=dev
```

---

## ⚙️ Step 4: Configure Production Environment Variables

Create the `.env` file inside the `backend` directory:

```bash
nano .env
```

Paste your production credentials:

```ini
PORT=5000
NODE_ENV=production

# MongoDB Atlas Database Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/jobgraph?retryWrites=true&w=majority

# Groq AI Service
GROQ_API_KEY=your_groq_api_key_here

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Authentication & CORS
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=https://your-frontend.onrender.com
```

> **Nano Shortcuts**:
> - Save: Press `Ctrl + O`, then press `Enter`.
> - Exit: Press `Ctrl + X`.

> [!IMPORTANT]
> **MongoDB Atlas Whitelist**: Go to [MongoDB Atlas](https://cloud.mongodb.com/) → **Network Access** → **IP Access List** → Click **Add IP Address** and add `3.107.75.32` (or allow `0.0.0.0/0` temporarily).

---

## 🔄 Step 5: Start & Daemonize Server with PM2

PM2 ensures your backend runs in the background 24/7 and restarts automatically if it crashes or the instance reboots.

```bash
# 1. Install PM2 globally
sudo npm install -g pm2

# 2. Start the backend app
pm2 start server.js --name "jobby-backend"

# 3. Configure PM2 to start on EC2 reboot
pm2 startup
# (Copy and run the `sudo env PATH=...` command printed on the terminal)

# 4. Save current PM2 processes
pm2 save
```

### Useful PM2 Commands:
| Action | Command |
| :--- | :--- |
| **Check server status** | `pm2 status` |
| **View real-time logs** | `pm2 logs jobby-backend` |
| **Restart application** | `pm2 restart jobby-backend` |
| **Stop application** | `pm2 stop jobby-backend` |

---

## 🛡️ Step 6: Configure AWS Security Group (Port 5000)

Ensure port `5000` is open to receive requests:

1. Open the [AWS EC2 Console](https://console.aws.amazon.com/ec2/).
2. Go to **Instances** → Click your running instance (`3.107.75.32`).
3. Click the **Security** tab → Click the link under **Security groups**.
4. In **Inbound rules**, click **Edit inbound rules**.
5. Add the following rule:
   - **Type**: `Custom TCP`
   - **Port range**: `5000`
   - **Source**: `Anywhere-IPv4` (`0.0.0.0/0`)
6. Click **Save rules**.

---

## 🧪 Step 7: Verify Backend Health

### Test from inside EC2:
```bash
curl http://localhost:5000/api/health
```

### Test from your local PC / Browser:
```bash
curl http://3.107.75.32:5000/api/health
```
**Expected Response:**
```json
{"status":"ok","message":"JobGraph API is running"}
```

---

## 🔀 Step 8: Connect with Nginx Load Balancer (Render)

Update your Render Load Balancer environment variables (or `nginx-load-balancer/env/.env`):

```ini
EC2_BACKEND_HOST=3.107.75.32
EC2_BACKEND_PORT=5000
EC2_BACKEND_PROTOCOL=http
```

The load balancer will now forward requests to your EC2 backend.

---

## 🔁 Step 9: Deploying Future Code Updates

Whenever you push new code to your Git repository, update EC2 with zero downtime:

```bash
# 1. SSH into the instance
ssh -i "my-first-key.pem" ec2-user@3.107.75.32

# 2. Pull the latest code
cd <your-repo-name>/backend
git pull origin main

# 3. Install any new dependencies
npm install --omit=dev

# 4. Reload PM2 with zero downtime
pm2 reload jobby-backend
```

---

## ⚠️ Troubleshooting Guide

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **`Permission denied (publickey)`** | Wrong username or key | Use `ec2-user` for Amazon Linux, `ubuntu` for Ubuntu. Check key permissions (`icacls`). |
| **`Connection timed out` on port 5000** | Security Group rule missing | Add inbound rule for Custom TCP port `5000` from `0.0.0.0/0`. |
| **Database connection error** | Atlas IP restriction | Whitelist Elastic IP `3.107.75.32` in MongoDB Atlas Network Access. |
| **Backend crashes on launch** | Missing environment variable | Check logs with `pm2 logs jobby-backend` and verify `.env` values. |
