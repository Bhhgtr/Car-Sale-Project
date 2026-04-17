# Stage 1: build React
FROM node:20-alpine AS build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build
RUN ls /app     

# Stage 2: run Express
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY api/ ./api
COPY --from=build /app/client/dist ./client/dist
EXPOSE 3000
CMD ["npm", "start"]