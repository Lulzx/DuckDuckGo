var express = require('express');
var telegram = require('../helpers/telegram.js');
var _ = require('underscore');
var router = express.Router();

router.post('/', function(req, res, next) {

    var telegramUpdate = req.body;
    console.log(telegramUpdate);

    var chat_id = telegramUpdate.message.chat.id;
    var reply_to_message_id = telegramUpdate.message.message_id;
    telegram.sendMessage(chat_id, 'Please come back later, I\'m unable to accept commands yet!', reply_to_message_id);

    // Send response to Telegram, always OK
    res.statusCode = 200;
    res.end();
});

module.exports = router;
