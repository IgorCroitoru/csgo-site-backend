const winston = require('winston'),
    SteamUser = require('steam-user'),
    SteamTotp = require('steam-totp'),
    EventEmitter = require('events').EventEmitter,
    logger = require('../log'),
    TradeOfferManager =require('steam-tradeoffer-manager'),
    SteamCommunity = require('steamcommunity'),
    errors = require('../exceptions/api-error'); 

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

    constructor(settings) {
        super();

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
            community: this.community 
          });
        
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

        logger.info(`Logging in ${this.username}`);


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

        logger.debug(`${this.username} About to connect`);
        this.steamClient.logOn(this.loginData);
    }

    bindEventHandlers() {
        this.steamClient.on('error', (err) => {
            logger.error(`Error logging in ${this.username}:`, err);

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
            logger.warn(`${this.username} Logged off, reconnecting! (${eresult}, ${msg})`);
           
        });

        this.steamClient.on('loggedOn', (details, parental) => {
            logger.info(`${this.username} Log on OK`);
            
           
        })
        this.steamClient.on('webSession', (sessionID, cookies)=>{
            this.manager.setCookies(cookies, (err) => {
                if (err) {
                    console.log(err);
                    process.exit(1); // Fatal error since we couldn't get our API key
                    return;
                }
            logger.info(`${this.username} WebSession on OK and cookies set`)
            this.community.setCookies(cookies)
            this.ready = true;
            logger.info(`${this.username} is Ready!`)
            })
        })
        this.community.on("sessionExpired", ()=> {
            logger.warn(`Session expired for ${this.username}. Relogging...`)
            this.steamClient.webLogOn();
        })
     
       
    }

    sendInventoryRequest(userID) {
        return new Promise((resolve, reject) => {
            if (!this.ready) {
                reject(errors.NoBotsAvailable);
                return;
            }
    
            this.busy = true;
    
            this.manager.getUserInventoryContents(userID, 730, 2, false, (err, inventory) => {
                 // Reset busy flag regardless of success or failure
    
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
                    resolve(inventory); // Resolve the promise with the inventory data
                    this.busy = false;

                }
            });
        });
    }
    
    
    
    
    
    

   
}



module.exports = Bot;
 
