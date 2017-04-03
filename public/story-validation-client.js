angular.module('app').factory('storyValidationClient', createStoryValidationClient);

function createStoryValidationClient() {
    var storyValidationClient = {};
    storyValidationClient.validStoryNoJargon = function validStoryNoJargon(data) {
        var words = data.split(/\s+/);
        var jargonTerms = ['jargon','java','batch'];
        words.forEach(function(word) {
            if (word.toLowerCase() in jargonTerms)
                return {
                    'pass': false,
                    'reason': 'jargon word \'' + word + '\' used' 
                }
        })
        return { 'pass': true }
    }
    storyValidationClient.validStoryFormat = function validStoryFormat(data) {
        var valid_pattern = /As a .*?\r?\n?I want .*?\r?\n?so that\s?/igm;
        if (data === '') {
            return {
                'pass': false,
                'reason': 'The story is blank'
            }
        } else if (valid_pattern.test(data)) {
            return {
                'pass': true
            }
        } else {
            return {
                'pass': false,
                'reason': 'The story does not match the user story format'
            }
        }
    }
    return storyValidationClient;
}