FROM node:22-slim

# Install Chromium and Thai fonts for Puppeteer PDF generation
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-thai-tlwg \
    postgresql-common \
    gnupg \
    ca-certificates \
    --no-install-recommends && \
    /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y && \
    apt-get update && apt-get install -y postgresql-client-16 && \
    rm -rf /var/lib/apt/lists/*

# Tell puppeteer-core to use the system Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
