const errors = require('../exceptions/api-error')
module.exports = function (err, req, res, next) {
    // Check if the error is one of your custom error types
    if (err instanceof errors.Error) {

      // Respond with the custom error
      return err.respond(res);
      
    }
    else {
      console.log(err)
      return errors.GenericBad.respond(res)
    }
}  