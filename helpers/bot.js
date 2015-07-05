var _ = require('underscore');
var telegram = require('../helpers/telegram.js');
var ddg = require('../helpers/ddg.js');

var bot = {

    processUpdate: function(telegramUpdate) {
        // Check the update
        if (!_.isUndefined(telegramUpdate.message) && !_.isUndefined(telegramUpdate.message.chat)) {
            // Get the message sent by the user
            var message = telegramUpdate.message.text;
            if (!_.isUndefined(message)) {
                // Get details from the Telegram update object
                var chat_id = telegramUpdate.message.chat.id;
                var reply_to_message_id = telegramUpdate.message.message_id;
                var first_name = telegramUpdate.message.chat.first_name;
                var username = telegramUpdate.message.chat.username;
                if (!_.isUndefined(chat_id) && !_.isUndefined(reply_to_message_id) && !_.isUndefined(first_name)) {
                    // Check the command
                    if (message.lastIndexOf('/q', 0) === 0) {
                        bot.sendAnswer(chat_id, reply_to_message_id, first_name, username, message);
                    } else if ((message.lastIndexOf('/start', 0) === 0) || (message.lastIndexOf('/help', 0) === 0)) {
                        bot.sendHelp(chat_id, reply_to_message_id, first_name, username);
                    } else if (message.lastIndexOf('/settings', 0) === 0) {
                        bot.sendSettings(chat_id, reply_to_message_id, first_name, username);
                    }
                }
            }
        }
    },

    sendAnswer: function(chat_id, reply_to_message_id, first_name, username, message) {
        // Get the question from the message
        var question = message.replace(/^\/q/, '').trim();
        if (!_.isUndefined(question) && question.length > 0) {
            // Get the answer from DuckDuckGo
            ddg.getAnswer(question, function(answer) {
                // Create the answer message
                var answerMessage;
                var replyTo = (_.isUndefined(username)) ? first_name : '@' + username;
                if (!_.isUndefined(answer) && answer.length > 0) {
                    var answerMessage = replyTo + ', here is the answer to your question:\n\n';
                    answerMessage += answer;
                } else {
                    var answerMessage = replyTo + ', I\'m sorry but I could not find an answer to your question.';
                }
                // Send answer message with Telegram API
                telegram.sendMessage(chat_id, answerMessage, reply_to_message_id);
            });
        } else {
            // Question is missing, send the help text
            bot.sendHelp(chat_id, reply_to_message_id, first_name, username);
        }
    },

    sendHelp: function(chat_id, reply_to_message_id, first_name, username) {
        // Send help message with Telegram API
        var helpMessage = '@DuckDuckBot sends you instant answers from DuckDuckGo.\n' +
                          '\n' +
                          'You can send a question with the /q command, for example:\n' +
                          '\n' +
                          '/q what is DuckDuckGo?\n' +
                          '\n' +
                          '\n' + 
                          '@DuckDuckBot is open source and currently developed by @rvanmil.\n' +
                          'You can find the source code on GitHub.';
        telegram.sendMessage(chat_id, helpMessage, reply_to_message_id);
    },

    sendSettings: function(chat_id, reply_to_message_id, first_name, username) {
        // Send settings message with Telegram API
        var helpMessage = '@DuckDuckBot has no settings.';
        telegram.sendMessage(chat_id, helpMessage, reply_to_message_id);
    }

};

module.exports = bot;
