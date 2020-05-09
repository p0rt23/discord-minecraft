FROM alpine

RUN apk update && \
    apk add build-base && \
    apk add python && \
    apk add nodejs && \
    apk add npm 

COPY ./discord-minecraft /discord-minecraft
WORKDIR /discord-minecraft
RUN npm install

ENTRYPOINT ["node", "/discord-minecraft/src/app.js"]
