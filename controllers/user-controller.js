const UserDto = require('../dtos/user-dto');
const userService = require('../services/user-service')
const Utils = require('../utils/utils');
const errors = require('../exceptions/api-error')
const botController = require('../bot/bot-controller').botController
require('dotenv').config();

class UserController {

    
    async getOffers(req, res){
      const bot = botController.getFreeBot();
      await bot.getOffers();
    }

    async deposit(req, res, next){
      try{
      
        await botController.pushInQueue(req.body.items, req.user, (err, deposit)=>{
          if(err){
            res.json({"success": false});
            
          }
          if(deposit){
          res.json({"success": true,
                    "id": deposit.transactionId
            })
          }
        });
      
      } 
      catch(e){
        next(e)
        
      }
    }

    async getInventory(req, res, next){
      try {
        const user = req.user
        const inventory = await userService.getInventory(user);
        res.json({"inventory": inventory.items})
        
      }
      catch(e){
        next(e)
      }
    }
    async setInventory(req, res, next) {
      try{
        const user = req.user

        const inventory = await userService.setInventory(user)
        res.json({"inventory": inventory.items})
      }
      catch(e){
        //console.log(e+'useinventory')
        next(e);
      }
    }

    async setTradeURL(req, res,next) {
        try {
          const { tradeURL } = req.body;
          const user = req.user;
          const isURLvalid = Utils.tradeURLverify(user.id64, tradeURL);
          if (!tradeURL || !isURLvalid) {
            // If the URL is not valid, return an error response
            throw errors.BadTradeUrl
          } else {
            
            // If the URL is valid, proceed with setting the trade URL
            const newUser = await userService.setTradeURL(user._id, tradeURL);
      
            if (newUser) {
              res.status(200).json({ success: true, updated_user: newUser });
            }
          }
        } catch (error) {
          next(error)
        }
      }
      
    
  

    async logout(req, res) {
        try {
            res.clearCookie('connect.sid');
            req.session.destroy(function(err) {
                if (err) {
                  console.error('Error destroying session:', err);
                  throw errors.LogoutError
                } 
              });
           res.status(200).send({'status': 'ok'})
        } catch (e) {
            next(e)
        }
    }
}

module.exports = new UserController();