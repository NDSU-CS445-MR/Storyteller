/*global firebase:true*/
/*eslint no-undef: 2*/

	
angular.module('app').factory('firebaseFactory', function($q){
    var firebaseRef = firebase.database().ref();
    var databaseFactory = {};
    databaseFactory.sessionStore = {
        currentUserKey: '',
        currentBoardKey: ''
    };
    databaseFactory.testFirebaseConnection = function(){
        var deferred = $q.defer();
        firebaseRef.child('.info/connected').on('value', function(connectedSnap) {
            if(connectedSnap.val() === true){
                var response = {
                    connected: connectedSnap.val(),
                    ref: firebaseRef.toString()
                };
                deferred.resolve(response);
            }
            // else if(connectedSnap.val() === false){
            //     deferred.resolve(connectedSnap.val());
            // }           
		});
        return deferred.promise;
    };
    // board methods
    databaseFactory.createBoard = function(board){
        var newBoard = {
            name: board.name,
            ownerUser: board.ownerUser,
            users: [],
            stories: board.stories,
            active: true
        };
        var boardRef = firebaseRef.child('boards').push(newBoard);
        return boardRef;
    };
    /* // delegate to angular 
    databaseFactory.deactivateBoard = function(board) { };
    */
    databaseFactory.deleteBoard = function(board) {
      // firebaseRef.child('boards').
    };
    databaseFactory.getBoard = function(boardKey) {
        var deferred = $q.defer();
        var board = firebaseRef.child('boards').child(boardKey);
        return board;
    };
    // user story methods
    databaseFactory.createUserStory = function(story) {
        firebaseRef.child('boards').child(this.sessionStore.currentBoardKey).push(story);
    };
    databaseFactory.deleteUserStory = function(story) {};
    databaseFactory.getUserStories = function(board, user) {};
    // logging methods
    databaseFactory.log = function(logRecord) {};
    return databaseFactory;
});