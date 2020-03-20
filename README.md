# discord-minecraft
Minecraft DiscordBot

## Setup
    echo "TOKEN=12345" > ./discord-minecraft/.env
    docker build -t p0rt23/discord-minecraft .
    docker run -d --network="elastic" --name="discord-minecraft"  p0rt23/discord-minecraft

