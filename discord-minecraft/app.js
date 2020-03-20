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

async function run() {
    const { body } = await elastic.search({
        index: 'filebeat-*',
        body: {
            query: {
                match: { message: 'client' }
            }
        }
    })
        
    console.log(body.hits.hits)
}

run().catch(console.log)
