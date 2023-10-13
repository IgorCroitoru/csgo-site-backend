const express = require('express');
const passport = require('passport');
const router = express.Router();
require('dotenv').config();
const userService = require('../services/user-service');
const userController = require('../controllers/user-controller');
const AuthMiddleware = require('../middleware/authMiddleware')
const UserDto = require('../dtos/user-dto');
const axios = require('axios')
const {botController} = require('../bot/bot-controller');
// Route for Steam authentication
router.get('/auth/steam', passport.authenticate('steam'));

//Callback route after successful Steam authentication
router.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  async (req, res) => {
    res.redirect('/');   
  }
);

// Logout route
router.post('/logout', userController.logout);
router.get('/inventory', AuthMiddleware, userController.getInventory)
router.post('/refresh-inventory', AuthMiddleware ,userController.setInventory)
router.get('/bots', AuthMiddleware, (req, res)=> {
  const am = botController.getReadyAmount();
  res.json(am)
});


router.get('/me', AuthMiddleware,(req, res) => {
    //const userDto = new UserDto(req.user);
    res.json(req.user);
});

router.post('/set-tradeurl', AuthMiddleware,userController.setTradeURL)



module.exports = router;
