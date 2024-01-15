class Error {
    constructor(message, internalCode, statusCode) {
      this.message = message; // Set the error name to the class name
      this.code = internalCode;
      this.statusCode = statusCode;
    }
  
    getJSON() {
      return { error: this.message, code: this.code, status: this.statusCode };
    }
  
    respond(res) {
      res.status(this.statusCode).json(this.getJSON());
    }
  
    toString() {
      return `[Code ${this.code}] - ${this.message}`;
    }
  }
  
  module.exports = {
   Error: Error,
    BadParams: new Error('Improper Parameter Structure', 1, 400),
    InvalidInspect: new Error('Invalid Inspect Link Structure', 2, 400),
    MaxRequests: new Error('You have too many pending requests', 3, 400),
    TTLExceeded: new Error('Valve\'s servers didn\'t reply in time', 4, 500),
    SteamOffline: new Error('Valve\'s servers appear to be offline, please try again later', 5, 503),
    GenericBad: new Error('Something went wrong on our end, please try again', 6, 500),
    BadBody: new Error('Improper body format', 7, 400),
    BadSecret: new Error('Bad Secret', 8, 400),
    NoBotsAvailable: new Error('No bots available to fulfill this request', 9, 500),
    RateLimit: new Error('Rate limit exceeded, too many requests', 10, 429),
    MaxQueueSize: new Error('Queue size is full, please try again later', 11, 500),
    NotAuthorized: new Error('Not authorized', 12, 401),
    InventoryGetError: new Error('Error getting inventory from db', 13, 500),
    UpdateInventoryError: new Error('Error update inventory at our end', 14, 500),
    TradeUrlUpdateError: new Error('Error updating trade url', 15,500),
    PrivateProfileError: new Error('This inventory/profile is private',16, 403),
    ItemsNotFound: new Error('Items not found', 17, 400),
    CreatingOfferError: new Error('Error creating offer', 18, 400),
    BadTradeUrl: new Error('Bad trade url',19,400),
    NotYourTradeUrl: new Error('Bad trade url', 20, 400)
  };