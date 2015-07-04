var express = require('express');
var bot = require('../helpers/bot.js');
var router = express.Router();

router.post('/', function(req, res, next) {
    // Pass the request body to the bot
    bot.processUpdate(req.body);
    // Send response to Telegram, always OK
    res.statusCode = 200;
    res.end();
});

module.exports = router;
