module.exports = class UserDto {
    avatar;
    _id;
    id64;
    name;
    tradeURL;
    mail;

    constructor(model) {
        this.avatar = model.avatar
        this.id64 = model.id64
        this._id = model._id 
        this.name = model.name
        this.tradeURL = model.tradeURL;
        this.mail = model.mail;
        }
}
