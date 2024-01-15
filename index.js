const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const userApiRoutes = require('./routes/userApiRoutes');
const userRoutes = require('./routes/routes')
const session = require('express-session');
const passport = require('./passport/passport');
const MongoDBStore = require('connect-mongodb-session')(session);
const logger = require('./log');
const botController = require('./bot/bot-controller').botController
const authMiddleware = require('./middleware/authMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const http = require('http');
const socketIo = require('socket.io');



const optionDefinitions = [
  { name: 'config', alias: 'c', type: String, defaultValue: './config.js' }, // Config file location
  { name: 'steam_data', alias: 's', type: String } // Steam data directory
];
const args = require('command-line-args')(optionDefinitions);
const CONFIG = require(args.config);
  



logger.level = CONFIG.logLevel || 'debug';

if (CONFIG.logins.length === 0) {
  console.log('There are no bot logins. Please add some in config.json');
  process.exit(1);
}


const PORT = process.env.PORT;
const app = express();

const server = http.createServer(app); // Create an HTTP server

const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle trade-related events here
  // Example: socket.on('tradeUpdate', (data) => { /* Handle trade update */ });
});

const store = new MongoDBStore({
  uri: process.env.DB_URL,
  collection: 'sessions',
});

app.use(express.json());
app.use(cors({
    origin: process.env.FRONT_URL, // Replace with your frontend's URL
    credentials: true,
  }));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
// Set up session
app.use(
    session({
      store: store,
      secret: process.env.SESSION_SECRET, // Change this to your desired secret key
      resave: false,
      saveUninitialized: false,
      cookie: {
       // sameSite: 'none',
        httpOnly: true, // Make sure HTTP-only flag is set
        secure: false, // Set to true if using HTTPS
      },
    })
  );
app.use(cookieParser(process.env.SESSION_SECRET))

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

  
app.use('/api', userApiRoutes);
app.use('/',userRoutes)

app.use(errorMiddleware);

const start = async () => {
    try {
        mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        
        app.listen(PORT, () => console.log(`Server started on PORT = ${PORT}`))
    
      
        for (let [i, loginData] of CONFIG.logins.entries()) {
            const settings = Object.assign({}, CONFIG.bot_settings);
            if (CONFIG.proxies && CONFIG.proxies.length > 0) {
                const proxy = CONFIG.proxies[i % CONFIG.proxies.length];
        
                if (proxy.startsWith('http://')) {
                    settings.steam_user = Object.assign({}, settings.steam_user, {httpProxy: proxy});
                } else if (proxy.startsWith('socks5://')) {
                    settings.steam_user = Object.assign({}, settings.steam_user, {socksProxy: proxy});
                } else {
                    console.log(`Invalid proxy '${proxy}' in config, must prefix with http:// or socks5://`);
                    process.exit(1);
                }
            }
        
            botController.addBot(loginData, settings, loginData.id);
            
        }
    } catch (e) {
        console.log(e);
    }
}


start()