const Bot = require('./bot'),
    EventEmitter = require('events').EventEmitter,
    utils = require('../utils/utils'),
    logger = require('../log'),
    errors = require('../exceptions/api-error'),
    async = require('async'),
    util = require('util'),
    setTimeoutPromise = util.promisify(setTimeout),
    Queue = require('./queue'),
    OffersProcessor = require('./offersProcessor');

class BotController extends EventEmitter {
    constructor() {
        super();

        this.readyEvent = false;
        this.bots = [];
        this.botsQueue = [];
        this.testQ = [];
    }

    addBot(loginData, settings, id) {
        let bot = new Bot(settings, id);
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
            if (bot.ready) return bot;
        }

        return false;
    }



    async pushInQueue(items, user, callback) {
        const bot = this.getFreeBot();
        if (!bot) {
            callback(errors.NoBotsAvailable, null);
            return;
        }
        try{
        if(!this.botsQueue[bot.id]){
            this.botsQueue[bot.id] = new Queue(2000);
        }
        const task = await bot.createOffer(items, user);
        this.botsQueue[bot.id].enqueue(async () => {
           await bot.processOffer(task, (err, deposit)=> {
            if(err){
                callback(err, null)
            }
                deposit.userId = user._id;
                callback(null, deposit);
           });
           
        })
        }
        catch(err){
            //console.log(err);
            throw err;
        }
        // Create a new queue for the bot if it doesn't exist
        
        
    }
    

    // async pushInQueue(items, user, callback) {
    //     const bot = this.getFreeBot();
    //     if (!bot) {
    //         callback(errors.NoBotsAvailable, null);
    //         return;
    //     }
    //     if (!this.botsQueue[bot]) {
    //         this.botsQueue[bot] = new OffersProcessor(async (task, taskCallback) => {
    //             try {
    //                 logger.info(`[BOT#${task.botId}] processing deposit ${task.transactionId}`);
    //                 await new Promise(resolve => setTimeout(resolve, 4000));
    //                 await bot.processOffer(task)
    //                 taskCallback(null, task); 
    //             } catch (error) {
    //                 taskCallback(error, null); 
    //             }
    //         });
    //     }
    
    //     try {
    //         const task = await bot.createOffer(items, user);
    //         this.botsQueue[bot].enqueue(task, (err, result) => {
    //             if (err) {
    //                 // Handle the error here
    //                 logger.error(`Error processing offer ${task.transactionId} : ${err}`);
    //                 callback(err, null);
    //             } else {
    //                 callback(null, result);
    //             }
    //         });
    //     } catch (error) {
    //         callback(error, null);
    //     }
    // }
    


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