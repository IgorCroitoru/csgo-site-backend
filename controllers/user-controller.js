const UserDto = require('../dtos/user-dto');
const userService = require('../services/user-service')
const Utils = require('../utils/utils');
const errors = require('../exceptions/api-error')
require('dotenv').config();

class UserController {

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
          const { user, tradeURL } = req.body;
          const isURLvalid = await Utils.tradeURLverify(user.id64, tradeURL);
      
          if (!isURLvalid) {
            // If the URL is not valid, return an error response
            throw errors.WrongTradeUrl
          } else {
            // If the URL is valid, proceed with setting the trade URL
            const result = await userService.setTradeURL(user._id, tradeURL);
            const newUser = new UserDto(result);
      
            if (result) {
              res.status(200).json({ success: true, updated_user: newUser });
            }
          }
        } catch (error) {
          next(e)
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