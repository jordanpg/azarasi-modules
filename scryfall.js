const uri = require('urijs');
const rp = require('request-promise')
const scryfall = 'https://api.scryfall.com/cards/';
const lookupPattern = /\[\[([^\]]+)\]\]/g;
const randomPattern = /\?(.+)?/;

class ScryfallModule extends BotModule
{
    scryfallMsg(msg)
    {
        var m = msg.content.match(lookupPattern);
        if(!m)
            return;

        var check = {}
        lookupPattern.lastIndex = 0;
        do {
            m = lookupPattern.exec(msg.content);

            if(!m || !m[1] || m[1] in check)
                continue;
            check[m[1]] = true;

            this.scryfallLookup(msg, m[1]);
        } while(m)
    }

    async scryfallLookup(msg, cardName)
    {
        try
        {
            var cardObj = await this.getCardObj(cardName);
        }
        catch (e)
        {
            if(cardName[0] == '!')
                cardName = cardName.slice(1);

            return msg.reply("No results found for \"" + cardName + ",\" or too many matches exist");
        }

        if(!cardObj || cardObj['object'] != "card")
        {
            if(cardName[0] == '!')
                cardName = cardName.slice(1);

            msg.reply("No results found for \"" + cardName + "\"");
            return undefined;
        }

        const emb = this.embedCard(cardObj);

        return msg.channel.send('', { embed: emb });
    }

    embedCard(cardObj)
    {
        var value = '';
        if(cardObj["prices"]["usd"])
            value += "  $" + cardObj["prices"]["usd"];
        if(cardObj["prices"]["usd_foil"])
            value += "  $" + cardObj["prices"]["usd_foil"] + " Foil";
        if(cardObj["prices"]["tix"])
            value += "  " + cardObj["prices"]["tix"] + " tix";
        if(value == '')
            value = "-";

        const embed = {
            "color": 0xAE7F9C,
            "title": cardObj['name'],
            "url": cardObj['scryfall_uri'],
            "description": cardObj['oracle_text'] + (('flavor_text' in cardObj) ? "\n\n*" + cardObj['flavor_text'] + "*": ""),
            "image":
            {
                "url": cardObj['image_uris']['normal']
            },
            "author":
            {
                "name": "Scryfall",
                "icon_url": "https://i.imgur.com/Bmv5qik.png"
            },
            "fields": [
            {
                "name": "Type",
                "value": cardObj['type_line'],
                "inline": true
            },
            {
                "name": "Mana Cost",
                "value": (cardObj["mana_cost"] ? cardObj["mana_cost"] : "-"),
                "inline": true
            },
            {
                "name": "Price",
                "value": value,
                "inline": true
            }]
        };

        return embed;
    }

    constructQuery(cardName)
    {
        var m = cardName.match(randomPattern);
        if (m)
            return uri(scryfall).segment("random").query({ q: m[1] }).toString();

        var q;
        if(cardName[0] == '!')
            q = { exact: cardName.slice(1), format: 'json' };
        else
            q = { fuzzy: cardName, format: 'json' };

        return uri(scryfall).segment("named").query(q).toString();
    }

    async getCardObj(cardName)
    {
        var qs = this.constructQuery(cardName);

        try
        {
            var obj = await rp.get(qs);
            return JSON.parse(obj);
        }
        catch (e)
        {
            return Promise.reject(undefined);
        }
    }

    ready()
    {
        this.registerEvent('discord.message', this.scryfallMsg);
    }
};

module.exports = ScryfallModule;
