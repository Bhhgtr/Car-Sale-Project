FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV HUSKY=0

COPY package*.json ./
RUN npm ci --only=production

COPY api/ ./api

EXPOSE 3000
CMD ["npm", "start"]