angular.module('app').factory('sessionStore',initializeSessionStore);

function initializeSessionStore($cookies){
    console.log('Initialized');
    this.setSessionData = function(user){
        console.log(user);
        var userData = {
            name: user.name,
            email: user.email,
            key: user.id,
            type: user.type,
            authorizedBoards: user.authorizedBoards
        }
        $cookies.putObject('sessionData',userData);
        // Get cookie
        var data = $cookies.getObject('sessionData');
        console.log(data);
    }
    return this;
};