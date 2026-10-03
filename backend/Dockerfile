FROM node:20-alpine

# Install build tools, native compilation dependencies and PostgreSQL client
RUN apk add --no-cache python3 make g++ postgresql-client curl wget

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build application
ENV MEDUSA_TELEMETRY_DISABLED=1
RUN npm run build

# Make entrypoint script executable
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
