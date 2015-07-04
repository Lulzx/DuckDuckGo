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
                var responseData = JSON.parse(output);
                console.log('ddg - received response code: ' + ddgResponse.statusCode);
                // Parse the response
                var isBang = (question.lastIndexOf('!', 0) === 0);
                var answer = ddg.parseResponse(responseData, isBang);
                onAnswer(answer);
            });
        });
        // Handle error
        ddgRequest.on('error', function(err) {
            console.error('ddg API error: ' + err.message);
            onAnswer('Sorry, could not retrieve an answer from DuckDuckGo.');
        });
        // End the request
        ddgRequest.end();
    },

    parseResponse: function(responseData, isBang) {
        var answer = '';
        // If it was a !bang question, then only return the redirect link
        if (isBang) {
            // Get the redirect link
            if (!_.isUndefined(responseData.Redirect) && responseData.Redirect.length > 0) {
                answer = responseData.Redirect;
            }
            return answer;
        } else {
            // First check if an abstract was returned
            if (!_.isUndefined(responseData.AbstractText) && responseData.AbstractText.length > 0) {
                answer = responseData.AbstractText;
            }
            return answer;
        }
    }

};

module.exports = ddg;
