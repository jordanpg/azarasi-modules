const tumblr = require('tumblr.js');
const tumblrAuth = { consumer_key: process.env.TUMBLR_CONSUMER_KEY };
const tumblrPattern = /https:\/\/([^\.]+\.tumblr\.com)\/post\/([0-9]+)/g;
const tumblrClient = tumblr.createClient(tumblrAuth);

class TumblrModule extends BotModule
{
    postMedia(msg, obj, slc=1)
    {
        if(!obj || !obj['posts'][0]['photos'])
            return;

        var p = obj['posts'][0]['photos'].slice(slc);

        var i;
        for(i in p)
            msg.channel.send(p[i]['original_size']['url']);
    }

    ready()
    {
        this.registerEvent('discord.message', (msg) => {
            if(!process.env.TUMBLR_CONSUMER_KEY || msg.content[0] == '!')
                return;
            var m;
            var c = {};
            do {
                m = tumblrPattern.exec(msg.content);
                if(!m || !m[1] || !m[2] || m[0] in c)
                    continue;

                var url = m[1];
                var pid = m[2];

                tumblrClient.blogPosts(url, {id: pid}, (err,data) => {
                    if(err)
                        return;

                    this.postMedia(msg, data);
                })
            } while (m);
        });
    }
};

module.exports = TumblrModule;
