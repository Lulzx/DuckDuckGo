var https = require('https');
var config = require('../config/config.js');
var querystring = require('querystring');
var _ = require('underscore');

var telegram = {

    sendMessage: function(chat_id, text, reply_to_message_id, disable_web_page_preview, onDone) {
        // Input for the Telegram API
        var telegramRequestData = querystring.stringify({
            chat_id: chat_id,
            text: text,
            reply_to_message_id: reply_to_message_id,
            disable_web_page_preview: disable_web_page_preview
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
            telegramResponse.on('data', function (chunk) {
                output += chunk;
            });
            // Log the response code
            telegramResponse.on('end', function() {
                // Log the repsonse message if the status code is not OK
                if (telegramResponse.statusCode !== 200) {
                    console.log(output);
                }
                if (!_.isUndefined(onDone)) {
                    onDone();
                }
            });
        });
        // Handle error
        telegramRequest.on('error', function(err) {
            // Log the error
            console.error('Telegram API error: ' + err.message);
            if (!_.isUndefined(onDone)) {
                onDone();
            }
        });
        // Send the input
        telegramRequest.write(telegramRequestData);
        // End the request
        telegramRequest.end();
    }

};

module.exports = telegram;
