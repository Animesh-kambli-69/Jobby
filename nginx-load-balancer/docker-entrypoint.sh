#!/bin/sh
set -eu

# Fallback PORT for local Docker testing if not supplied by Render
: "${PORT:=80}"

# Support both new explicit names and legacy BACKEND_1_HOST / BACKEND_2_HOST
EC2_BACKEND_HOST="${EC2_BACKEND_HOST:-${BACKEND_1_HOST:-}}"
RENDER_BACKEND_HOST="${RENDER_BACKEND_HOST:-${BACKEND_2_HOST:-}}"

if [ -z "$EC2_BACKEND_HOST" ]; then
  echo "========================================================================" >&2
  echo "ERROR: EC2_BACKEND_HOST is not set!" >&2
  echo "Please set EC2_BACKEND_HOST in your Render Environment Variables." >&2
  echo "Example: EC2_BACKEND_HOST=54.123.45.67 (or ec2-xx.compute.amazonaws.com)" >&2
  echo "========================================================================" >&2
  exit 1
fi

if [ -z "$RENDER_BACKEND_HOST" ]; then
  echo "========================================================================" >&2
  echo "ERROR: RENDER_BACKEND_HOST is not set!" >&2
  echo "Please set RENDER_BACKEND_HOST in your Render Environment Variables." >&2
  echo "Example: RENDER_BACKEND_HOST=your-backend.onrender.com" >&2
  echo "========================================================================" >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# 1. Parse & Sanitize EC2 Backend Host, Port, and Protocol
# ------------------------------------------------------------------------------
if echo "$EC2_BACKEND_HOST" | grep -q '^https://'; then
  EC2_BACKEND_PROTOCOL="${EC2_BACKEND_PROTOCOL:-https}"
elif echo "$EC2_BACKEND_HOST" | grep -q '^http://'; then
  EC2_BACKEND_PROTOCOL="${EC2_BACKEND_PROTOCOL:-http}"
fi

# Strip protocol scheme and trailing slashes
EC2_BACKEND_HOST=$(echo "$EC2_BACKEND_HOST" | sed -e 's|^https*://||' -e 's|/*$||')

# Extract port if embedded in host (e.g. 54.12.34.56:5000)
if echo "$EC2_BACKEND_HOST" | grep -q ':'; then
  EXTRACTED_PORT=$(echo "$EC2_BACKEND_HOST" | cut -d: -f2)
  EC2_BACKEND_HOST=$(echo "$EC2_BACKEND_HOST" | cut -d: -f1)
  EC2_BACKEND_PORT="${EC2_BACKEND_PORT:-$EXTRACTED_PORT}"
fi

: "${EC2_BACKEND_PROTOCOL:=http}"
: "${EC2_BACKEND_PORT:=${BACKEND_PORT:-5000}}"

# ------------------------------------------------------------------------------
# 2. Parse & Sanitize Render Backend Host, Port, and Protocol
# ------------------------------------------------------------------------------
if echo "$RENDER_BACKEND_HOST" | grep -q '^https://'; then
  RENDER_BACKEND_PROTOCOL="${RENDER_BACKEND_PROTOCOL:-https}"
elif echo "$RENDER_BACKEND_HOST" | grep -q '^http://'; then
  RENDER_BACKEND_PROTOCOL="${RENDER_BACKEND_PROTOCOL:-http}"
fi

# Strip protocol scheme and trailing slashes
RENDER_BACKEND_HOST=$(echo "$RENDER_BACKEND_HOST" | sed -e 's|^https*://||' -e 's|/*$||')

# Extract port if embedded in host
if echo "$RENDER_BACKEND_HOST" | grep -q ':'; then
  EXTRACTED_PORT=$(echo "$RENDER_BACKEND_HOST" | cut -d: -f2)
  RENDER_BACKEND_HOST=$(echo "$RENDER_BACKEND_HOST" | cut -d: -f1)
  RENDER_BACKEND_PORT="${RENDER_BACKEND_PORT:-$EXTRACTED_PORT}"
fi

# Automatic protocol detection for Render:
# Render public web services (*.onrender.com) use HTTPS over port 443.
# Render private services use HTTP.
if [ -z "${RENDER_BACKEND_PROTOCOL:-}" ]; then
  case "$RENDER_BACKEND_HOST" in
    *.onrender.com*) RENDER_BACKEND_PROTOCOL="https" ;;
    *) RENDER_BACKEND_PROTOCOL="http" ;;
  esac
fi

if [ -z "${RENDER_BACKEND_PORT:-}" ]; then
  if [ "$RENDER_BACKEND_PROTOCOL" = "https" ]; then
    RENDER_BACKEND_PORT="443"
  else
    RENDER_BACKEND_PORT="${BACKEND_PORT:-5000}"
  fi
fi

# Export all variables for envsubst
export PORT
export EC2_BACKEND_HOST
export EC2_BACKEND_PORT
export EC2_BACKEND_PROTOCOL
export RENDER_BACKEND_HOST
export RENDER_BACKEND_PORT
export RENDER_BACKEND_PROTOCOL

echo "========================================================================"
echo " Starting Jobby Hybrid Load Balancer on Render"
echo "------------------------------------------------------------------------"
echo " Web Service Port:  ${PORT}"
echo " Backend 1 (EC2):    ${EC2_BACKEND_PROTOCOL}://${EC2_BACKEND_HOST}:${EC2_BACKEND_PORT}"
echo " Backend 2 (Render): ${RENDER_BACKEND_PROTOCOL}://${RENDER_BACKEND_HOST}:${RENDER_BACKEND_PORT}"
echo "========================================================================"

# Substitute only our designated variables into the template
envsubst '${PORT} ${EC2_BACKEND_HOST} ${EC2_BACKEND_PORT} ${EC2_BACKEND_PROTOCOL} ${RENDER_BACKEND_HOST} ${RENDER_BACKEND_PORT} ${RENDER_BACKEND_PROTOCOL}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

# Test nginx configuration before launching
nginx -t

echo "Nginx configuration verified successfully. Launching service..."
exec nginx -g 'daemon off;'
