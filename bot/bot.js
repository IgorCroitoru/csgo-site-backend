const SteamUser = require('steam-user'),
    SteamTotp = require('steam-totp'),
    EventEmitter = require('events').EventEmitter,
    logger = require('../log'),
    TradeOfferManager =require('steam-tradeoffer-manager'),
    SteamCommunity = require('steamcommunity'),
    errors = require('../exceptions/api-error'),
    DepositModel = require('../models/deposit-model'),
    UserModel = require('../models/user-model'),
    Queue = require('./queue'),
    FS = require('fs'),
   // OffersProcessor = require('./offersProcessor'),
    Utils = require('../utils/utils'),
    async = require('async');

class Bot extends EventEmitter{
      /**
     * Sets the ready status and sends a 'ready' or 'unready' event if it has changed
     * @param {*|boolean} val New ready status
     */

    set ready(val) {
    const prev = this.ready;
    this.ready_ = val;

    if (val !== prev) {
        this.emit(val ? 'ready' : 'unready');
    }
}

    /**
     * Returns the current ready status
     * @return {*|boolean} Ready status
     */
    get ready() {
        return this.ready_ || false;
    }

    constructor(settings, id) {
        super();
        this.activeTrades = new Map();
        this.totalActiveTrades = 0;
        this.id = id;
        this.settings = settings;
        this.busy = false;
        this.community = new SteamCommunity();
        this.steamClient = new SteamUser(Object.assign({
            promptSteamGuardCode: false,
            enablePicsCache: true // Required to check if we own CSGO with ownsApp
        }, this.settings.steam_user));
        this.manager = new TradeOfferManager({
            steam: this.steamClient,
            domain: 'localhost', // Replace with your domain or IP address
            language: 'en',
            community: this.community,
            pollInterval: 5000,
            //cancelTime: 10000
            
          });
        
        if (FS.existsSync('polldata.json')) {
        this.manager.pollData = JSON.parse(FS.readFileSync('polldata.json').toString('utf8'));
        }

        this.bindEventHandlers();
       
    }

  

    logOff(){
        logger.warn(`${this.steamClient.username} is loggedOff`)
        this.steamClient.logOff();
        
    }

    logIn(username, password, auth) {
        this.ready = false;

        // Save these parameters if we login later
        if (arguments.length === 3) {
            this.username = username;
            this.password = password;
            this.auth = auth;
        }

        logger.info(`[BOT#${this.id}] Logging in ${this.username}`);


        this.loginData = {
            accountName: this.username,
            password: this.password,
            rememberPassword: true,
        };

        if (this.auth && this.auth !== '') {
            // Check if it is a shared_secret
            if (this.auth.length <= 5) this.loginData.authCode = this.auth;
            else {
                // Generate the code from the shared_secret
                logger.debug(`${this.username} Generating TOTP Code from shared_secret`);
                this.loginData.twoFactorCode = SteamTotp.getAuthCode(this.auth);
            }
        }

        logger.debug(`[BOT#${this.id}] ${this.username} About to connect`);
        this.steamClient.logOn(this.loginData);
    }

    bindEventHandlers() {
        this.steamClient.on('error', (err) => {
            logger.error(`[BOT#${this.id}] Error logging in ${this.username}:`, err);

            let login_error_msgs = {
                61: 'Invalid Password',
                63: 'Account login denied due to 2nd factor authentication failure. ' +
                    'If using email auth, an email has been sent.',
                65: 'Account login denied due to auth code being invalid',
                66: 'Account login denied due to 2nd factor auth failure and no mail has been sent'
            };

            if (err.eresult && login_error_msgs[err.eresult] !== undefined) {
                logger.error(this.username + ': ' + login_error_msgs[err.eresult]);
            }

            // Yes, checking for string errors sucks, but we have no other attributes to check
            // this error against.
            if (err.toString().includes('Proxy connection timed out')) {
                this.logIn();
            }
        });

        this.steamClient.on('disconnected', (eresult, msg) => {
            logger.warn(`[BOT#${this.id}] ${this.username} Logged off, reconnecting! (${eresult}, ${msg})`);
           
        });

        this.steamClient.on('loggedOn', (details, parental) => {
            this.id64 = details.client_supplied_steamid
            logger.info(`${this.username} Log on OK`);
            
           
        })
        this.steamClient.on('webSession', (sessionID, cookies)=>{
            this.manager.setCookies(cookies, (err) => {
                if (err) {
                    console.log(err);
                    process.exit(1); // Fatal error since we couldn't get our API key
                    return;
                }
            logger.info(`[BOT#${this.id}] ${this.username} WebSession on OK and cookies set`)
            this.community.setCookies(cookies)
            this.ready = true;
            logger.info(`[BOT#${this.id}] ${this.username} is Ready!`)
            //this.getHistory()
            })
        })
        this.community.on("sessionExpired", ()=> {
            logger.warn(`[BOT#${this.id}] Session expired for ${this.username}. Relogging...`)
            this.steamClient.webLogOn();
        })
        this.manager.on("sentOfferChanged", async (offer, oldState) => {
          logger.warn(`[BOT#${this.id}] Sent Offer #${offer.id} changed: ${TradeOfferManager.ETradeOfferState[oldState]} -> ${TradeOfferManager.ETradeOfferState[offer.state]}`);
          await DepositModel.updateOne({offerID: offer.id},
            {
            $set: {
                state: offer.state
            }
            
        })
            if(offer.state === 4){
                offer.decline(async (err)=>{
                    
                })
            }
        })

        this.manager.on('pollData', function(pollData) {
            FS.writeFileSync('polldata.json', JSON.stringify(pollData));
        });

        this.manager.on("pollFailure", (err)=> {
            logger.warn("Poll failed: "+ err);
        })

        this.manager.on("sentOfferCanceled", async (offer, reason)=> {
            logger.info(`[BOT#${this.id}] Offer ${offer.id} cancelled. Reason: {${reason}}`)
            await DepositModel.updateOne({offerID: offer.id},
                {
                $set: {
                    state: offer.state
                }
            })

        })
        
        
    }
    // getHistory(){
    //     const now = new Date();
    //     const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()-3); // Start of the current day
    //     const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59); // End of the current day
    
    //     //this.manager.getOffersContainingItem()
    //     this.manager.getOffer("6482741392",(err,offer)=>{
    //         console.log(offer)
    //     })
    //      this.manager.getOffers(TradeOfferManager.EOfferFilter.HistoricalOnly,startOfDay,(err,sent,re) => {
    //         console.log(sent)
    //     })
    // }


    addActiveTrade(userId, offerDetails, offerId){

        if (!this.activeTrades.has(userId)) {
            this.activeTrades.set(userId, new Map());
        }

        this.activeTrades.get(userId).set(offerId, offerDetails)
          // Increment the total active trades counter
          this.totalActiveTrades++;

        return offerDetails;
    }
    
    removeActiveTrade(userId, offerId){
        if(this.activeTrades.has(userId)&&this.activeTrades.get(userId).has(offerId)){
            const removed = this.activeTrades.get(userId).get(offerId);
            this.activeTrades.get(userId).delete(offerId);

            if(this.activeTrades.get(userId).size===0){
                this.activeTrades.delete(userId)
            }
            this.totalActiveTrades--;
            return removed;
            
        }
        return null;
    }

    getTradesForUser(userId) {
        return this.activeTrades.get(userId) || [];
      }

    async getOffers(){
        this.manager.getOffers(1, async (err,sent,received) => {
            console.log(sent)
        })
        }

    getFilteredInventory(items, userID){
        return new Promise((resolve, reject) => {
            if (!this.ready) {
                reject(errors.NoBotsAvailable);
                return;
            }
    
            this.busy = true;
    
            this.manager.getUserInventoryContents(userID, 730, 2, false, (err, inventory) => {
    
                if (err) {
                    if (err.message =='This profile is private.'){
                        reject(errors.PrivateProfileError);
                        this.busy = false;

                        return
                    }
                    console.error(err); // Log the error
                    reject(err); 
                    this.busy = false;
                } else {
                    const matchingItems = inventory.filter((userItem) => {
                        return items.some((items) => {
                        return (
                            userItem.assetid === items.assetid
                        );
                        });
                    });
                    resolve(matchingItems); // Resolve the promise with the inventory data
                    this.busy = false;

                }
            });
        });
    }

    sendInventoryRequest(userID) {
        return new Promise((resolve, reject) => {
            // if (!this.ready) {
            //     reject(errors.NoBotsAvailable);
            //     return;
            // }
            this.busy = true;
    
            this.manager.getUserInventoryContents(userID, 730, 2, false, (err, inventory) => {
                if (err) {
                    if (err.message =='This profile is private.'){
                        reject(errors.PrivateProfileError);
                        this.busy = false;

                        return
                    }
                    reject(err); 
                    this.busy = false;
                } else {
                    resolve(inventory); // Resolve the promise with the inventory data
                    this.busy = false;

                }
            });
        });
    }

    
    /**
     * 
     * @param {*} itemsArray an array of assetid's of items
     * @param {*} user an user object with id64
     * @returns an object of TradeOffer object and transactionId (id of created transaction in db)  
     */
    async createOffer(itemsArray, user){
        const items = itemsArray.map(item => { return { assetid: item} });

        const u = await UserModel.findOne({id64: user.id64})
        let deposit;

        try {
            deposit = await DepositModel.create({
                user: u._id,
                botID64: this.id64,
                items: items
            })

            const matchingItems = await this.getFilteredInventory(items, u.id64)
            if(items.length!==matchingItems.length){
                throw errors.ItemsNotFound
            }
            let offer = this.manager.createOffer(u.tradeURL)
            offer.addTheirItems(matchingItems)
          
            try {
                const meAndThem = await new Promise((resolve, reject) => {
                  offer.getUserDetails((err, me, them) => {
                    if (err || !them) {
                      reject(errors.BadTradeUrl);
                    } else {
                      resolve([me, them]);
                    }
                  });
                });
              } catch (error) {
                throw error;
              }
              return {offer, transactionId: deposit.transactionId};
            }

            
        catch(err)
        {   
            console.log(err)
            
            if (deposit){
            await DepositModel.findOneAndDelete({_id: deposit._id})
            }
           
            throw err;
        }
    }

    async processOffer(deposit, callback){
        try{
           
            deposit.offer.send(async (err, status)=>{
                if (err){
                    
                    logger.error(`An error ocurred while sending offer #${deposit.transactionId}`);
                    //console.log(err)
                    await DepositModel.deleteOne({transactionId: deposit.transactionId})
                    callback(err, null)
                }
                await DepositModel.updateOne({transactionId: deposit.transactionId},
                    {
                    $set: {
                        offerID: deposit.offer.id,
                        status: status,
                        state: deposit.offer.state
                    }
                }
                    )
                    logger.info(`[BOT#${this.id}] Offer #${deposit.offer.id} was sent successfully` )
                    this.addActiveTrade(deposit.userId, deposit.offer, deposit.offer.id)
                    callback(null, deposit)
                })
               
            }
        catch(err){
            console.log(err);
            throw err;
        }

    }

   
   
}

module.exports = Bot;
 
