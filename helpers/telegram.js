var https = require('https');
var config = require('../config/config.js');
var querystring = require('querystring');

var telegram = {

    sendMessage: function(chat_id, text, reply_to_message_id) {

        var telegramRequestData = querystring.stringify({
            chat_id: chat_id,
            text: text,
            reply_to_message_id: reply_to_message_id
        });

        var telegramRequestOptions = {
            host: 'api.telegram.org',
            port: 443,
            path: '/bot' + config.telegramToken + '/sendMessage',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': telegramRequestData.length
            }
        };

        var telegramRequest = https.request(telegramRequestOptions, function(telegramResponse) {
            telegramResponse.setEncoding('utf8');

            var output = '';
            telegramResponse.on('data', function (chunk) {
                output += chunk;
            });

            telegramResponse.on('end', function() {
                var obj = JSON.parse(output);
                console.log('Telegram - received response code: ' + telegramResponse.statusCode);
            });
        });

        telegramRequest.on('error', function(err) {
            console.error('Telegram API error: ' + err.message);
        });

        telegramRequest.write(telegramRequestData);

        telegramRequest.end();

    }

};

module.exports = telegram;
