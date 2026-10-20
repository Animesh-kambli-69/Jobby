# Nginx Load Balancer for AWS EC2 Backend Cluster

This setup distributes traffic across your **2 AWS EC2 backend servers** for the Jobby backend application.

---

## 🏗️ Architecture

```
Internet (Users / Frontend)
           │
           ▼ (Port 80 / 443)
┌─────────────────────────────────┐
│     EC2 #1: Nginx Load Balancer │
└─────────────────────────────────┘
           │
     ┌─────┴────────────────┐ (least_conn routing)
     ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│ EC2 Backend #1   │  │ EC2 Backend #2   │
│ Port 5000        │  │ Port 5000        │
└──────────────────┘  └──────────────────┘
```

---

## 🔒 AWS Security Groups Setup

1. **Load Balancer EC2 Security Group (`sg-load-balancer`)**:
   - Inbound: **Port 80 (HTTP)** from `0.0.0.0/0`
   - Inbound: **Port 443 (HTTPS)** from `0.0.0.0/0`
   - Inbound: **Port 22 (SSH)** from your IP only

2. **Backend EC2s Security Group (`sg-backend`)**:
   - Inbound: **Port 5000 (Custom TCP)** from `sg-load-balancer` (Load Balancer's Security Group ID or Private IP)
   - Inbound: **Port 22 (SSH)** from your IP only

> **💡 Best Practice:** Place the Load Balancer and the 2 Backend EC2s in the **same AWS VPC**. Use their **Private IPs** in `nginx.conf` for lower latency, higher security, and zero data-transfer costs.

---

## 🚀 Deployment Options

### Option A: Install Nginx Directly on the EC2 Load Balancer

1. SSH into your Load Balancer EC2:
   ```bash
   ssh -i your-key.pem ubuntu@<EC2-LB-PUBLIC-IP>
   ```

2. Install Nginx:
   ```bash
   sudo apt update && sudo apt install -y nginx
   ```

3. Replace `/etc/nginx/nginx.conf` with the provided [nginx.conf](file:///c:/Users/Ani/OneDrive/Desktop/codes/jobby/nginx-load-balancer/nginx.conf):
   ```bash
   sudo nano /etc/nginx/nginx.conf
   ```
   *Replace `EC2_BACKEND_1_IP` and `EC2_BACKEND_2_IP` with your actual EC2 private/public IPs.*

4. Test configuration and restart:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

### Option B: Run via Docker on the Load Balancer EC2

1. Build and run the load balancer container:
   ```bash
   cd nginx-load-balancer
   docker build -t jobby-load-balancer .
   docker run -d --restart always -p 80:80 --name jobby-lb jobby-load-balancer
   ```

---

## 🧪 Verification & Testing

1. Check Load Balancer Health:
   ```bash
   curl http://<EC2-LB-PUBLIC-IP>/lb-health
   # Returns: {"status":"ok","lb":"active"}
   ```

2. Check Backend API through Load Balancer:
   ```bash
   curl http://<EC2-LB-PUBLIC-IP>/api/health
   # Returns: {"status":"ok","message":"JobGraph API is running"}
   ```

3. Watch traffic distribution across both EC2s:
   Run 10 requests:
   ```bash
   for i in {1..10}; do curl -s http://<EC2-LB-PUBLIC-IP>/api/health; echo ""; done
   ```
   Inspect `/var/log/nginx/access.log` on your backend servers to see requests being distributed.

---

## 🔐 Free SSL with Let's Encrypt (Certbot)

Once your domain points to the Load Balancer EC2:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```
Certbot will automatically configure the SSL certificates and reload Nginx.
