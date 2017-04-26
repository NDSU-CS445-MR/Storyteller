/*global firebase:true*/
/*eslint no-undef: 2*/

	
angular.module('app').factory('firebaseConnection', createFirebaseConnection);

// what does $q do?
function createFirebaseConnection($q){
    var fb_reference = firebase.database().ref();
    var firebaseConnection = {};
    
    // todo describe object
    firebaseConnection.sessionStore = {
        currentUserKey: '-Ke1QRQYnknYmWwC48VA',
        currentBoardKey: '-Kibv581Q_giCS_NhjqP'
    };
    
    // todo describe method
    firebaseConnection.createUserProfile = function(){
        var newUser = {
            firstName: 'Testy',
            lastName: 'McTestface'
        };
        this.sessionStore.currentUserKey = fb_reference.child('users').push(newUser).getKey();
    };
    
    // todo describe method
    firebaseConnection.testFirebaseConnection = function(){
        var deferred = $q.defer();
        fb_reference.child('.info/connected').on('value', function(connectedSnap) {
            if(connectedSnap.val() === true){
                var response = {
                    connected: connectedSnap.val(),
                    ref: fb_reference.toString()
                };
                deferred.resolve(response);
            }
            // else if(connectedSnap.val() === false){
            //     deferred.resolve(connectedSnap.val());
            // }           
        });
        return deferred.promise;
    };
    /* board methods */
    
    firebaseConnection.createStatus = function createStatus(boardRef, statusObj) {
        boardRef
            .child('statuses')
            .push({
                name: statusObj.name || 'unnamed',
                order: statusObj.order || 2,
                color: statusObj.color || '#AFA',
                deletable: statusObj.deletable,
                display: statusObj.display
            });
    }
    
    firebaseConnection.shiftStatusOrdersIfConflict = function shiftStatusOrders(boardRef, greaterThan) {
        // check if there is a conflict
        boardRef
            .child('statuses')
            .orderByChild('order')
            .startAt(greaterThan)
            .endAt(greaterThan)
            .once('value', function() {
                boardRef
                    .child('statuses')
                    .orderByChild('order')
                    .startAt(greaterThan)
                    // todo handle query results
                    .once('value', null)
            })
    }
    
    // create new board
    firebaseConnection.createBoard = function createBoard (board){
        var newBoard = {
            name: board.name,
            ownerUser: board.ownerUser,
            users: [],
            stories: board.stories,
            active: true,
            columns: 10,
        };
        var boardRef = fb_reference.child('boards').push(newBoard);
        firebaseConnection.createStatus(boardRef, {
            name: 'mvp',
            order: 1,
            color: '#F88',
            deletable: false,
            display: true
        });
        firebaseConnection.createStatus(boardRef, {
            name: 'under consideration',
            order: 2,
            color: '#88F',
            deletable: false,
            display: true,
            default: true
        });
        firebaseConnection.createStatus(boardRef, {
            name: 'discarded',
            color: '#FFF',
            deletable: false,
            display: false,
        });
        return boardRef;
    };
    
    // deactivate existing board
    /*
    firebaseConnection.deactivateBoard = function(board) {
      // fb_reference.child('boards').
    };
    */
    
    // 
    firebaseConnection.getBoardByKey = function(boardKey) {
        return fb_reference
          .child('boards')
          .child(boardKey);
    };
    // logging methods
    firebaseConnection.log = function(message) {
        log_object = {
            time: (new Date()).getTime(),
            message: message
        }
      
        fb_reference
          .child('log')
          .push(log_object)
    };
    return firebaseConnection;
}