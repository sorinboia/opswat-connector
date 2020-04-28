FROM node:12-alpine

COPY package*.json ./
RUN npm install
COPY . .

ENV OPSWAT mustchage
ENV BACKEND mustchage
ENV RETRY mustchange
ENV INTERVAL mustchange

EXPOSE 3000
CMD ["sh","-c", "node index.js --opswat=$OPSWAT --backend=$BACKEND --statusRetry=$RETRY --statusInterval=$INTERVAL" ]