FROM node:22-slim
WORKDIR /app
COPY node_modules ./node_modules
COPY dist ./dist
EXPOSE 4000
CMD ["node", "dist/apps/kyb-mock/main.js"]
