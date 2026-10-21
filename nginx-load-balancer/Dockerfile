FROM nginx:alpine

# Install gettext for envsubst, ca-certificates for secure upstream SSL handshakes, and curl for diagnostics
RUN apk add --no-cache gettext ca-certificates curl

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy the configuration template and Render startup script
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY docker-entrypoint.sh /usr/local/bin/jobby-nginx-entrypoint

# Ensure Linux LF line endings and executable permissions (prevents Windows CRLF bugs on Render)
RUN sed -i 's/\r$//' /usr/local/bin/jobby-nginx-entrypoint && \
    chmod +x /usr/local/bin/jobby-nginx-entrypoint

EXPOSE 80 443

ENTRYPOINT ["jobby-nginx-entrypoint"]
