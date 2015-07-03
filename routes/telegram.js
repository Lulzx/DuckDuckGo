var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {

    var telegramUpdate = req.body;


    // Send response to Telegram, always OK
    res.statusCode = 200;
    res.end();
});

module.exports = router;
