FROM node:18-alpine

# Sharp needs some system dependencies for some architectures, 
# but on alpine it often works better with specific builds.
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
