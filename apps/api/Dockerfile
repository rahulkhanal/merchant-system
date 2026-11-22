FROM node:22-slim
WORKDIR /app
COPY node_modules ./node_modules
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/apps/api/main.js"]
