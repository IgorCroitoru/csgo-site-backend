const UserModel = require('../models/user-model');
const UserDto = require('../dtos/user-dto');
const {botController} = require('../bot/bot-controller');
const InventoryModel = require('../models/inventory-model');
const errors = require('../exceptions/api-error')


class UserService {

    async getInventory(user) {
        try{
        const inventory = await InventoryModel.findOne({user: user._id})
        return inventory;
        }
        catch(err){
            throw errors.InventoryGetError
        }
    }
    async setInventory(user) {
        try {
            const inventory = await botController.lookupInventory(user.id64)
            const itemDocumentsArray = inventory.map(i => {
                const item = {
                    name: i.name,
                    assetid: i.assetid,
                    type: i.type,
                    rarity: i.rarity,
                    marketable: i.marketable,
                    tradable: i.tradable,
                    icon_url: i.icon_url,
                    inspect_link: i.inspect_link,
                    name_tag: i.name_tag,
                    stickers: i.stickers
                };
                return item;
            });

            let newInventory = await InventoryModel.findOneAndUpdate(
                { user: user._id },
                {
                    $set: {
                        user_id64: user.id64,
                        items: itemDocumentsArray,
                    }
                },
                { new: true }
            );
    
            if (!newInventory) {
                newInventory = await InventoryModel.create( 
                    { user: user._id ,
                        user_id64: user.id64,
                     items: itemDocumentsArray });
            }
            return newInventory;
        } catch (error) {

            throw error;
        }
    }


    async setTradeURL(userId, tradeURL) {

        try {
            const newUser = await UserModel.findByIdAndUpdate(userId, { tradeURL }, { new: true });
            return newUser;
        }
        catch(error)
        {
            throw errors.TradeUrlUpdateError;
        }

    }

    
    
   
   
}

module.exports = new UserService();