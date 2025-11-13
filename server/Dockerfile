FROM node:20-alpine AS builder

	WORKDIR /app

	COPY package*.json ./

	RUN npm ci --only=production

	COPY . .

FROM builder AS production

	CMD ["npm", "run", "start"]
