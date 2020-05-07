'use strict';

require('dotenv').config();
const token  = process.env.TOKEN;

const { Client } = require('@elastic/elasticsearch');
const elastic = new Client({ node: 'http://elasticsearch:9200' });

const Discord = require('discord.js');
const discord = new Discord.Client();

discord.on('ready', () => {
    console.info(`minecraft-bot: Logged in as ${discord.user.tag}!`);
});

discord.login(token);

discord.on('message', msg => {
    if (msg.content === '!mc-logins') {
        console.info(`minecraft-bot: ${msg.author.username} said "${msg.content}"`);
        
        get_logins(24).then(logins => {
            if (logins) {
                msg.reply(logins);
            }
        });
    }
});

async function get_logins(hours) {
    try {
        const { body } = await elastic.search({
            index: 'filebeat-*',
            body: {
                query: {
                    "bool": {
                        "must": [],
                        "filter": [
                            {
                                "bool": {
                                    "should": [{
                                        "match": {
                                            "message": "restarting"
                                        }
                                    }],
                                    "minimum_should_match": 1
                                }
                            },
                            {
                                "match_phrase": {
                                    "container.name": "filebeat"
                                }
                            },
                            {
                                "range": {
                                    "@timestamp": {
                                        "gte": "2020-05-06T06:00:00.000Z",
                                        "lte": "2020-05-07T05:59:59.999Z",
                                        "format": "strict_date_optional_time"
                                    }
                                }
                            }
                        ],
                    }
                }
            }
        });
        return `Logins for past ${hours} hours: ${body.hits.total.value}`;
    }
    catch(e) {
        console.error(e);
    }
}
