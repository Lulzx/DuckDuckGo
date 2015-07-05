var https = require('https');
var querystring = require('querystring');
var _ = require('underscore');

var ddg = {

    getAnswer: function(question, onAnswer) {
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
                var answer = ddg.parseResponse(responseData, isBang);
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

    parseResponse: function(responseData, isBang) {
        var answer = '';
        // If it was a !bang question, then only return the redirect link
        if (isBang) {
            // Heading
            answer = 'You have requested a !bang link. Here it is:\n';
            // Get the redirect link
            if (!_.isUndefined(responseData.Redirect) && responseData.Redirect.length > 0) {
                answer += responseData.Redirect;
            }
            return answer;
        } else {
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

            return answer;
        }
    },

    parseInfoBox: function(infoBox) {
        var infoBoxTitle = '';
        var infoBoxValueString = '';
        if (!_.isUndefined(infoBox) && !_.isUndefined(infoBox.meta) && infoBox.meta.length > 0 && !_.isUndefined(infoBox.content) && infoBox.content.length > 0) {
            // Get the article title
            _.each(infoBox.meta, function(meta){
                if (meta.data_type === 'string' && meta.label === 'article_title') {
                    infoBoxTitle = meta.value;
                }
            }, this);
            // Read all content items and add the string values to the infobox string
            _.each(infoBox.content, function(content){
                if (content.data_type === 'string') {
                    if (!_.isUndefined(content.label) && content.label.length > 0 && !_.isUndefined(content.value) && content.value.length > 0) {
                        infoBoxValueString += content.label + ': ' + content.value + '\n';
                    }
                }
            }, this);
        }
        // Only return if title and values were found
        if (infoBoxTitle.length > 0 && infoBoxValueString.length > 0) {
            return infoBoxTitle + ' info: \n' + infoBoxValueString + '\n\n';
        } else {
            return '';
        }
    }

};

module.exports = ddg;
