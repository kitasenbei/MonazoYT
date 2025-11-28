#!/bin/bash

# MonazoYT Nginx Setup Script
# This script configures nginx for the frontend and backend

set -e

echo "Installing nginx..."
sudo apt update
sudo apt install -y nginx

echo "Disabling default nginx site..."
sudo rm -f /etc/nginx/sites-enabled/default

echo "Creating nginx configuration..."
sudo tee /etc/nginx/sites-available/monazoyt > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /home/sharo/monazoyt/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "Enabling site..."
sudo ln -sf /etc/nginx/sites-available/monazoyt /etc/nginx/sites-enabled/

echo "Testing nginx configuration..."
sudo nginx -t

echo "Enabling and starting nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "Opening firewall ports..."
sudo ufw allow 'Nginx Full' 2>/dev/null || echo "UFW not enabled, skipping firewall rules"

echo ""
echo "✓ Nginx setup complete!"
echo "✓ Frontend will be served from /home/sharo/monazoyt/frontend/dist"
echo "✓ Backend API proxied from http://localhost:3000"
echo "✓ Access your site at: http://139.162.161.224"
