ARG ACCOUNT_ID
ARG REGION
FROM ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/node:12-alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000 8080

CMD ["npm", "run","start"]
