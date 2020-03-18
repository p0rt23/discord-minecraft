require('dotenv').config();
const Discord = require('discord.js');

const token  = process.env.TOKEN;
const client = new Discord.Client();

client.on('ready', () => {
    console.info(`minecraft-bot: Logged in as ${client.user.tag}!`);
});

client.login(token);
