FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["node", "server.js"]
