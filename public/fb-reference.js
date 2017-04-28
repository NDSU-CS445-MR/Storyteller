/*global firebase:true*/
/*eslint no-undef: 2*/

	
angular.module('app').factory('firebaseConnection', createFirebaseConnection);

function createFirebaseConnection($q,sessionStore){
    var fb_reference = firebase.database().ref();
    var fb_auth = firebase.auth();
    var firebaseConnection = {};
    
    firebaseConnection.sessionStore = {
        currentBoardKey: 'i dont know how to make a normal key',
        currentUser: {
            id: '-KiCr5cFW5EW2kFbVG1f',
            email: null,
            loggedIn: false,
            type: 'admin'
            }
    };
    firebaseConnection.register = function(newUser){
        var deferred = $q.defer();
        fb_auth.createUserWithEmailAndPassword(newUser.email, newUser.password).then(function(res){
            if(res.uid){
                var user = {
                    name: newUser.name,
                    email: newUser.email,
                    type: newUser.type || 'basic',
                    uid: res.uid
                }
                fb_reference.child('users').push(user);
                var response = {success:true}
                deferred.resolve(response);
            }
            else{
                var response = {success:false}
                deferred.resolve(response);
            }
        });
        return deferred.promise;
    };
    firebaseConnection.authorize = function(username,password){
        var deferred = $q.defer();
        fb_auth.signInWithEmailAndPassword(username,password).then(
        function(authData){
           if(authData.uid){
                fb_reference.child('users').orderByChild('uid').equalTo(authData.uid).once('value',function(snap){
                    snap.forEach(function(element){
                        var user = element.val();
                        firebaseConnection.sessionStore.currentUser.id = element.key;
                        firebaseConnection.sessionStore.currentUser.name = user.name;
                        firebaseConnection.sessionStore.currentUser.email = user.email;
                        firebaseConnection.sessionStore.currentUser.type = user.type;
                        firebaseConnection.sessionStore.currentUser.loggedIn = true;
                        if(user.authorizedBoards[0]){
                            firebaseConnection.sessionStore.currentUser.authorizedBoards = user.authorizedBoards;
                        }
                        sessionStore.setSessionData(firebaseConnection.sessionStore.currentUser);
                           var response = {success:true};
                            deferred.resolve(response);
                    });
                 });              
           }
        }
        ).catch(function(error){
             var response = {success: false}
               deferred.resolve(response);
        });
        return deferred.promise;
    }
    firebaseConnection.updateUser = function(user){
        var boardsList =[];
        if(user.authorizeForAllBoards){
            fb_reference.child('boards').orderByChild('active').equalTo(true).once('value',function(snap){
               snap.forEach(function(element){
                   boardsList.push({name:element.val().name,key:element.key});
                });
            });
        }
        else boardsList = user.authorizedBoards;
        
        var updatedUser = {
            uid: user.uid,
            name: user.name,
            email: user.email,
            type: user.type,
            authorizeForAllBoards: user.authorizeForAllBoards || false,
            authorizedBoards: boardsList || 'null'
        }
        console.log(updatedUser);
        if(user.$id){
            fb_reference.child('users').child(user.$id).set(updatedUser);
        }
        else{
            firebaseConnection.register(user);
        }
    }
    firebaseConnection.deleteUser = function(user){
        fb_reference.child('users').child(user.$id).remove();
    }
    firebaseConnection.deactivateBoard = function(board){
        fb_reference.child('boards').child(board.$id).child('active').set(false);
    }
    firebaseConnection.updateBoard = function(board){
        var boardRef = fb_reference.child('boards').child(board.$id)
        boardRef.child('name').set(board.name);
        boardRef.child('jargonEnabled').set(board.jargonEnabled || false);
        boardRef.child('duplicateEnabled').set(board.duplicateEnabled || false);
        if(board.blackList){
            boardRef.child('blackList').set(board.blackList);
        }

    }
    firebaseConnection.authorizeBoard = function(userKey,board){
        fb_reference
            .child('users')
            .child(userKey)
            .child('authorizedBoards')
            .push(board);
    }
    
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
            active: true,
            columns: 10,
            jargonEnabled: board.jargonEnabled || false,
            duplicateEnabled: board.duplicateEnabled || false,
            blackList: board.blackList || '',
            edited: {
                jargon: false,
                duplicate: false
            }
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
    firebaseConnection.getBoards = function(){
        return fb_reference
            .child('boards').orderByChild('active').equalTo(true);
    }
    firebaseConnection.getUsers = function(){
        return fb_reference
            .child('users');
    }
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