var fb_config = {
    apiKey: 'AIzaSyBqqWTPOk3Jk-57yyY5yaB6eO2AU16mb3I',
    authDomain: 'storyteller-e1db0.firebaseapp.com',
    databaseURL: 'https://storyteller-e1db0.firebaseio.com',
    storageBucket: 'storyteller-e1db0.appspot.com',
    messagingSenderId: '963004166071'
};
//END FIREBASE CONFIGURATION OBJECT
var demo = true;
module.exports = {
fb_configRef: function(){
    return fb_config;
}
};
