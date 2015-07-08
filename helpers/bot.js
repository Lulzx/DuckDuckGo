var _ = require('underscore');
var telegram = require('../helpers/telegram.js');
var ddg = require('../helpers/ddg.js');

var bot = {

    maxMessageLength: 4096,

    processUpdate: function(telegramUpdate) {
        // Check the update
        if (!_.isUndefined(telegramUpdate.message) && !_.isUndefined(telegramUpdate.message.chat)) {
            // Get the message sent by the user
            var message = telegramUpdate.message.text;
            if (!_.isUndefined(message)) {
                // Get details from the Telegram update object
                var chat_id = telegramUpdate.message.chat.id;
                var reply_to_message_id = telegramUpdate.message.message_id;
                var first_name = telegramUpdate.message.from.first_name;
                var username = telegramUpdate.message.from.username;
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
        var replyMessage = '';
        if (!_.isUndefined(question) && question.length > 0) {
            // Init the reply message
            var replyTo = (_.isUndefined(username)) ? first_name : '@' + username;
            var replyMessageHeader = replyTo + ', here is the answer to your question:\n\n';
            // Calculate the maximum answer length
            var maxLength = bot.maxMessageLength - replyMessageHeader.length;
            // Get the answer from DuckDuckGo
            ddg.getAnswerMessages(question, maxLength, function(answerMessages) {
                // Create the reply message(s)
                if (!_.isUndefined(answerMessages) && answerMessages.length > 0) {
                    // Send a reply for each answer message
                    // Use the onDone callback to make sure the messages are sent in the correct order
                    var currentAnswerMessage = 0;
                    var onDone = _.bind(function() {
                        // Send the next message
                        // Add a short delay so the messages are also received in the correct order
                        // (I'm currently unaware of a way to do this properly through the Telegram API)
                        var sendNext = _.bind(function() {
                            currentAnswerMessage++;
                            if (currentAnswerMessage < answerMessages.length) {
                                replyMessage = answerMessages[currentAnswerMessage];
                                telegram.sendMessage(chat_id, replyMessage, reply_to_message_id, true, onDone);
                            } else {
                                // Done, all messages sent
                            }
                        }, this);
                        _.delay(sendNext, 1000);
                    }, this);
                    var firstAnswerMessage = _.first(answerMessages);
                    replyMessage = replyMessageHeader + firstAnswerMessage;
                    telegram.sendMessage(chat_id, replyMessage, reply_to_message_id, true, onDone);
                } else {
                    // No answer found
                    replyMessage = replyTo + ', I\'m sorry but I could not find an answer to your question.';
                    telegram.sendMessage(chat_id, replyMessage, reply_to_message_id, true);
                }
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
                          'DuckDuckBot does not collect or share personal information.\n' +
                          '\n' +
                          'DuckDuckBot is open source. You can find the source code on GitHub (https://github.com/rvanmil/DuckDuckBot).';
        telegram.sendMessage(chat_id, helpMessage, reply_to_message_id, true);
    },

    sendSettings: function(chat_id, reply_to_message_id, first_name, username) {
        // Send settings message with Telegram API
        var helpMessage = '@DuckDuckBot has no settings.';
        telegram.sendMessage(chat_id, helpMessage, reply_to_message_id, true);
    }

};

module.exports = bot;
