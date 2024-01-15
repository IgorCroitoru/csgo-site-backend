const rateLimit = require('express-rate-limit');

const inventoryLimiter = rateLimit({
    windowMs: 5000, // 1 second
    max: 1, 
    message: 'Too often',
    keyGenerator: (req) => {
      return req.ip;
    },
  });
  
  // Define a rate limiter for refresh-inventory route
  const refreshInventoryLimiter = rateLimit({
    windowMs: 10000, // 1 second
    max: 1, 
    message: 'Too often',
    keyGenerator: (req) => {
      return req.ip;
    },
  });

  const depositLimiter = rateLimit({
    windowMs : 4000,
    max: 100,
    message: 'Too often',
    keyGenerator: (req)=>{
        return req.ip
    },
  });

  module.exports = {
    inventoryLimiter,
    refreshInventoryLimiter,
    depositLimiter
  }