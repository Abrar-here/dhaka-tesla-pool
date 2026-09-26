FROM node:18-alpine

WORKDIR /app

# Copy only package files first so Docker can cache the npm install layer
# and skip re-installing dependencies when only source code changes.
COPY package*.json ./
RUN npm install --omit=dev

# Now copy the rest of the source code
COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]