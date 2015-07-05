var https = require('https');
var querystring = require('querystring');
var _ = require('underscore');

var ddg = {

    getAnswerMessages: function(question, maxLength, onAnswer) {
        // Query parameters for the DuckDuckGo API
        var ddgRequestData = querystring.stringify({
            q: question,
            format: 'json',
            no_html: 1,
            no_redirect: 1
        });
        // Create the request
        var ddgRequestOptions = {
            host: 'api.duckduckgo.com',
            port: 443,
            path: '/?' + ddgRequestData,
            method: 'GET'
        };
        // Execute the request
        var ddgRequest = https.request(ddgRequestOptions, function(ddgResponse) {
            ddgResponse.setEncoding('utf8');
            // Read the response
            var output = '';
            ddgResponse.on('data', function (chunk) {
                output += chunk;
            });
            // Parse the output when the response has ended
            ddgResponse.on('end', function() {
                // Log the response code
                console.log('DuckDuckGo API response code: ' + ddgResponse.statusCode);
                // Parse the response
                var responseData = JSON.parse(output);
                var isBang = (question.lastIndexOf('!', 0) === 0);
                var answer = ddg.parseResponse(responseData, maxLength, isBang);
                onAnswer(answer);
            });
        });
        // Handle error
        ddgRequest.on('error', function(err) {
            // Log the error
            console.error('DuckDuckGo API error: ' + err.message);
            // Return an error message
            onAnswer('Sorry, could not retrieve an answer from DuckDuckGo.');
        });
        // End the request
        ddgRequest.end();
    },

    parseResponse: function(responseData, maxLength, isBang) {
        var answerMessages = [];
        var answer = '';
        // If it was a !bang question, then only return the redirect link
        if (isBang) {
            // Heading
            answer = 'You have requested a !bang link. Here it is:\n';
            // Get the redirect link
            if (!_.isUndefined(responseData.Redirect) && responseData.Redirect.length > 0) {
                answer += responseData.Redirect;
            }
            answerMessages.push(answer);
            return answerMessages;
        } else {
            var remainingLength = 0;
            // Heading
            if (!_.isUndefined(responseData.Heading) && responseData.Heading.length > 0) {
                answer += responseData.Heading + '\n\n';
            }
            // First check if an abstract was returned
            if (!_.isUndefined(responseData.AbstractText) && responseData.AbstractText.length > 0) {
                answer += responseData.AbstractText + '\n\n';
            }
            // Add abstract source if one was returned
            if (!_.isUndefined(responseData.AbstractSource) && responseData.AbstractSource.length > 0 && !_.isUndefined(responseData.AbstractURL) && responseData.AbstractURL.length > 0) {
                answer += responseData.AbstractSource + ': ' + responseData.AbstractURL + '\n\n'
            }
            // InfoBox
            answer += ddg.parseInfoBox(responseData.Infobox);
            
            // From here on we will check the length of the answer message, making sure we don't exceed the maximum allowed length for a Telegram message

            // Results
            remainingLength = maxLength - answer.length;
            if (remainingLength < 50) {
                remainingLength = 0;
            }
            var resultStrings = ddg.parseResults(responseData.Results, remainingLength, maxLength);
            if (!_.isUndefined(resultStrings) && resultStrings.length > 0) {
                var isFirstResult = true;
                var resultCounter = 0;
                _.each(resultStrings, function(resultString) {
                    // The first result is based on the remaining length, so we can concatenate it
                    // to the current answer message
                    if (isFirstResult) {
                        isFirstResult = false;
                        answer += resultString;
                        answerMessages.push(answer);
                        answer = '';
                    } else {
                        if (resultCounter === resultStrings.length - 1) {
                            // The last result is not added to the answer messages list yet,
                            // because it can be short enough to add more text to it
                            answer = resultString;
                        } else {
                            // Next results, but not the last one, require their own answer message
                            // because they are based on the maxlength
                            answerMessages.push(resultString);
                        }
                    }
                    resultCounter++;
                }, this);
            }
            // Related Topics
            remainingLength = maxLength - answer.length;
            if (remainingLength < 50) {
                remainingLength = 0;
            }
            var relatedTopicStrings = ddg.parseRelatedTopics(responseData.RelatedTopics, remainingLength, maxLength);
            if (!_.isUndefined(relatedTopicStrings) && relatedTopicStrings.length > 0) {
                var isFirstRelatedTopic = true;
                var relatedTopicCounter = 0;
                _.each(relatedTopicStrings, function(relatedTopicString) {
                    // The first topic is based on the remaining length, so we can concatenate it
                    // to the current answer message
                    if (isFirstRelatedTopic) {
                        isFirstRelatedTopic = false;
                        answer += relatedTopicString;
                        answerMessages.push(answer);
                        answer = '';
                    } else {
                        if (relatedTopicCounter === relatedTopicStrings.length - 1) {
                            // The last topic is not added to the answer messages list yet,
                            // because it can be short enough to add more text to it
                            answer = relatedTopicString;
                        } else {
                            // Next topics, but not the last one, require their own answer message
                            // because they are based on the maxlength
                            answerMessages.push(relatedTopicString);
                        }
                    }
                    relatedTopicCounter++;
                }, this);
            }

            // Don't forget to add the last answer message to the list
            if (answer.length > 0) {
                answerMessages.push(answer);
                answer = '';
            }

            return answerMessages;
        }
    },

    parseInfoBox: function(infoBox) {
        var infoBoxTitle = '';
        var infoBoxValueString = '';
        if (!_.isUndefined(infoBox) && !_.isUndefined(infoBox.meta) && infoBox.meta.length > 0 && !_.isUndefined(infoBox.content) && infoBox.content.length > 0) {
            // Get the article title
            _.each(infoBox.meta, function(meta) {
                if (meta.data_type === 'string' && meta.label === 'article_title') {
                    infoBoxTitle = meta.value;
                }
            }, this);
            // Read all content items and add the string values to the infobox string
            _.each(infoBox.content, function(content) {
                if (content.data_type === 'string') {
                    if (!_.isUndefined(content.label) && content.label.length > 0 && !_.isUndefined(content.value) && content.value.length > 0) {
                        infoBoxValueString += content.label + ': ' + content.value + '\n';
                    }
                }
            }, this);
        }
        // Only return if title and values were found
        if (infoBoxTitle.length > 0 && infoBoxValueString.length > 0) {
            return infoBoxTitle + ' Info\n' + infoBoxValueString + '\n';
        } else {
            return '';
        }
    },

    parseResults: function(results, remainingLength, maxLength) {
        var resultsStrings = [];
        var resultsString = '';
        var currentRemainingLength = remainingLength;
        if (!_.isUndefined(results) && results.length > 0) {
            // Read all results items and add the links to the results string
            var isFirst = true;
            _.each(results, function(result) {
                if (!_.isUndefined(result.Text) && result.Text.length > 0 && !_.isUndefined(result.FirstURL) && result.FirstURL.length > 0) {
                    resultsStringPart = result.Text + ': ' + result.FirstURL + '\n';
                    if (isFirst) {
                        isFirst = false;
                        resultsStringPart = 'Links\n' + resultsStringPart + '\n';
                    }
                    if (resultsStringPart.length > currentRemainingLength) {
                        resultsStrings.push(resultsString);
                        resultsString = resultsStringPart;
                        currentRemainingLength = maxLength;
                    } else {
                        resultsString += resultsStringPart;
                    }
                    currentRemainingLength = currentRemainingLength - resultsStringPart.length;
                    if (currentRemainingLength < 0) {
                        currentRemainingLength = 0;
                    }
                }
            }, this);
            resultsStrings.push(resultsString);
        }
        return resultsStrings;
    },

    parseRelatedTopics: function(relatedTopics, remainingLength, maxLength) {
        var relatedTopicsStrings = [];
        var relatedTopicsString = '';
        var currentRemainingLength = remainingLength;
        if (!_.isUndefined(relatedTopics) && relatedTopics.length > 0) {
            // Read all related topics and add the links to the related topics string
            var isFirst = true;
            _.each(relatedTopics, function(relatedTopic) {
                // A related topic object can also be a collection of subtopics
                if (!_.isUndefined(relatedTopic.Name) && relatedTopic.Name.length > 0 && !_.isUndefined(relatedTopic.Topics) && relatedTopic.Topics.length > 0) {
                    // Subtopics
                    var isFirstSubTopic = true;
                    _.each(relatedTopic.Topics, function(relatedSubTopic) {
                        if (!_.isUndefined(relatedSubTopic.Text) && relatedSubTopic.Text.length > 0 && !_.isUndefined(relatedSubTopic.FirstURL) && relatedSubTopic.FirstURL.length > 0) {
                            relatedTopicsStringPart = relatedSubTopic.Text + ': ' + relatedSubTopic.FirstURL + '\n\n';
                            if (isFirstSubTopic) {
                                isFirstSubTopic = false;
                                relatedTopicsStringPart = '\nSubtopic ' + relatedTopic.Name + '\n\n' + relatedTopicsStringPart;
                            }
                            if (relatedTopicsStringPart.length > currentRemainingLength) {
                                relatedTopicsStrings.push(relatedTopicsString);
                                relatedTopicsString = relatedTopicsStringPart;
                                currentRemainingLength = maxLength;
                            } else {
                                relatedTopicsString += relatedTopicsStringPart;
                            }
                            currentRemainingLength = currentRemainingLength - relatedTopicsStringPart.length;
                            if (currentRemainingLength < 0) {
                                currentRemainingLength = 0;
                            }
                        }
                    }, this);
                } else {
                    // Main Topic
                    if (!_.isUndefined(relatedTopic.Text) && relatedTopic.Text.length > 0 && !_.isUndefined(relatedTopic.FirstURL) && relatedTopic.FirstURL.length > 0) {
                        relatedTopicsStringPart = relatedTopic.Text + ': ' + relatedTopic.FirstURL + '\n\n';
                        if (isFirst) {
                            isFirst = false;
                            relatedTopicsStringPart = 'Related Topics\n\n' + relatedTopicsStringPart;
                        }
                        if (relatedTopicsStringPart.length > currentRemainingLength) {
                            relatedTopicsStrings.push(relatedTopicsString);
                            relatedTopicsString = relatedTopicsStringPart;
                            currentRemainingLength = maxLength;
                        } else {
                            relatedTopicsString += relatedTopicsStringPart;
                        }
                        currentRemainingLength = currentRemainingLength - relatedTopicsStringPart.length;
                        if (currentRemainingLength < 0) {
                            currentRemainingLength = 0;
                        }
                    }
                }
            }, this);
            relatedTopicsStrings.push(relatedTopicsString);
        }
        return relatedTopicsStrings;
    }

};

module.exports = ddg;
