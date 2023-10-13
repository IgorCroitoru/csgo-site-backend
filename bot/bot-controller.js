const Bot = require('./bot'),
    EventEmitter = require('events').EventEmitter,
    utils = require('../utils/utils'),
    logger = require('../log'),
    errors = require('../exceptions/api-error')
class BotController extends EventEmitter {
    constructor() {
        super();

        this.readyEvent = false;
        this.bots = [];
    }

    addBot(loginData, settings) {
        let bot = new Bot(settings);
        bot.logIn(loginData.user, loginData.pass, loginData.auth);

        bot.on('ready', () => {
            if (!this.readyEvent && this.hasBotOnline()) {
                this.readyEvent = true;
                this.emit('ready');
            }
        });

        bot.on('unready', () => {
            if (this.readyEvent && this.hasBotOnline() === false) {
                this.readyEvent = false;
                this.emit('unready');
            }
        });
        this.bots.push(bot);
    }

    getFreeBot() {
        // Shuffle array to evenly distribute requests
        for (let bot of utils.shuffleArray(this.bots)) {
            if (!bot.busy && bot.ready) return bot;
        }

        return false;
    }

    hasBotOnline() {
        for (let bot of this.bots) {
            if (bot.ready) return true;
        }

        return false;
    }

    getReadyAmount() {
        let amount = 0;
        for (const bot of this.bots) {
            if (bot.ready) {
                amount++;
            }
        }
        return amount;
    }

    async lookupInventory(id64){
        let freeBot = this.getFreeBot();
        try {
            if (!freeBot) {
                throw errors.NoBotsAvailable;
            }
    
            const inventory = await freeBot.sendInventoryRequest(id64);
            const processedInventory = inventory.map((i) => {
                const stickers =[];
                const name = i.market_hash_name;
                const assetid = i.assetid;
                const icon_url = i.getLargeImageURL();
                const marketable = i.marketable;
                const tradable = i.tradable;
                const rarity = i.getTag('Rarity').name;
                const type = i.getTag('Type').name;
                const inspect_link = i.actions?.[0]?.link?.replace("%owner_steamid%", id64)?.replace("%assetid%", i.assetid).replace('%20','');

                const returnInv = {
                    "name": name,
                    "assetid": assetid,
                    "marketable": marketable,
                    "tradable": tradable,
                    "rarity": rarity,
                    "type": type,
                    "inspect_link": inspect_link,
                    "icon_url": icon_url
                }
                if(i.fraudwarnings.length>0){
                    returnInv["name_tag"]=utils.getNameTag(i.fraudwarnings[0])
                }

                if (i.descriptions && i.descriptions.length > 0 && i.descriptions[i.descriptions.length-1].value.trim()!=='' ) {
                    let stickerString = i.descriptions[i.descriptions.length-1].value;
                    utils.getStickers(stickerString, (error,sticks) => {
                      if (error) {
                        console.error('Error:', error.message);
                        } else {
                          
                        stickers.push(...sticks)
                        }
        
                    })

                    returnInv["stickers"] = stickers;
                      
                    }
                return returnInv;



            })
            return processedInventory;
        } catch (error) {
            throw error;
        }
    }
    
    
}

const botController = new BotController(); // Create a shared instance

module.exports = {
    BotController, // Export the class
    botController, // Export the shared instance
};