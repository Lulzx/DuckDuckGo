var https = require('https');
var config = require('../config/config.js');
var querystring = require('querystring');

var telegram = {

    sendMessage: function(chat_id, text, reply_to_message_id) {
        // Input for the Telegram API
        var telegramRequestData = querystring.stringify({
            chat_id: chat_id,
            text: text,
            reply_to_message_id: reply_to_message_id
        });
        // Create the request
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
        // Execute the request
        var telegramRequest = https.request(telegramRequestOptions, function(telegramResponse) {
            telegramResponse.setEncoding('utf8');
            // Read the response
            var output = '';
            ddgResponse.on('data', function (chunk) {
                output += chunk;
            });
            // Log the response code
            telegramResponse.on('end', function() {
                console.log('Telegram API response code: ' + telegramResponse.statusCode);
            });
        });
        // Handle error
        telegramRequest.on('error', function(err) {
            // Log the error
            console.error('Telegram API error: ' + err.message);
        });
        // Send the input
        telegramRequest.write(telegramRequestData);
        // End the request
        telegramRequest.end();
    }

};

module.exports = telegram;
