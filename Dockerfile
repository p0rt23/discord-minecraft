FROM alpine

RUN apk update && \
    apk add nodejs && \
    apk add npm

COPY ./discord-minecraft /discord-minecraft
WORKDIR /discord-minecraft
RUN npm install

ENTRYPOINT ["node", "/discord-minecraft/app.js"]
