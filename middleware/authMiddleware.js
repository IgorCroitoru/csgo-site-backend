const errors = require('../exceptions/api-error')

module.exports = function (req, res, next) {
    try {
       if(!req.isAuthenticated())
       {
        return next(errors.NotAuthorized)
       }
        next();
    } catch (e) {
        return next(errors.NotAuthorized);
    }
};