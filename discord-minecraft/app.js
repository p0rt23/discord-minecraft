'use strict'

require('dotenv').config();
const token  = process.env.TOKEN;

const { Client } = require('@elastic/elasticsearch')
const elastic = new Client({ node: 'http://elasticsearch:9200' })

const Discord = require('discord.js');
const discord = new Discord.Client();

discord.on('ready', () => {
    console.info(`minecraft-bot: Logged in as ${discord.user.tag}!`);
});

discord.login(token);

discord.on('message', msg => {
    if (msg.content === '!mc-logins') {
        console.info(msg.channel);
        
        const logins = get_logins(24).catch(console.log)

        if (logins) {
            msg.reply(logins);
        }
    }
});

async function get_logins(hours) {
    return "Logins here." 
}

async function run() {
    const { body } = await elastic.search({
        index: 'filebeat-*',
        body: {
            query: {
                match: { message: 'telemetry' }
                // match: { message: 'joined the game' }
            }
        }
    })
    
    if (body.hits.total > 0) {
        const channel = discord.channels.cache.get('<id>');
        channel.send('<content>');
        discord.channels[0].send(body.hits.hits)
    }
    console.log(body.hits.hits)
}

// setInterval(run().catch(console.log), 10*1000);
// run().catch(console.log)
