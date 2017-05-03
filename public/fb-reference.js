/*global firebase:true*/
/*eslint no-undef: 2*/

	
angular.module('app').factory('firebaseConnection', createFirebaseConnection);

function createFirebaseConnection($q,sessionStore){
    var fb_reference = firebase.database().ref();
    var fb_auth = firebase.auth();
    var firebaseConnection = {};
    if(demo){
    firebaseConnection.sessionStore = {
        currentBoardKey: '-Kibv581Q_giCS_NhjqP',
        currentUser: {
            id: '-KiCr5cFW5EW2kFbVG1f',
            email: null,
            loggedIn: false,
            type: 'admin'
            }
    };
    }
    else{
        firebaseConnection.sessionStore = {
        currentBoardKey: null,
        currentUser: {
            id: null,
            email: null,
            loggedIn: false,
            type: null
            }
    };
    }
    firebaseConnection.register = function(newUser){
        var deferred = $q.defer();
        //Adds an authorized user to the firebase authentication service
        fb_auth.createUserWithEmailAndPassword(newUser.email, newUser.password).then(function(res){
            if(res.uid){
                //Indicates that authentication was succesful
                var user = {
                    name: newUser.name,
                    email: newUser.email,
                    type: newUser.type || 'basic',
                    uid: res.uid
                };
                //Create a system user account that can be accessed by the application
                fb_reference.child('users').push(user);
                var response = {
                    success:true
                };
                deferred.resolve(response);
            }
            else{
                //Indicate that authentication was unsuccesful
                var response = {
                    success:false
                };
                deferred.resolve(response);
            }
        });
        return deferred.promise;
    };
    firebaseConnection.authorize = function(username,password){
        var deferred = $q.defer();
        //Authorizes with Firebase's authentication service
        fb_auth.signInWithEmailAndPassword(username,password).then(
        function(authData){
           if(authData.uid){
               //Upon successful authentication the user's system profile is referenced to extract system proprietary details
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
                        //Creates cookie for session
                        sessionStore.setSessionData(firebaseConnection.sessionStore.currentUser);
                        //Returns to login controller that authentication was successful and the user's credentails are active in the current session
                        var response = {
                            success:true
                        };
                        deferred.resolve(response);
                    });
                 });              
           }
        }
        ).catch(function(error){
            //Indicates that there was an error in authenticating with Firebase's authentication service
             var response = {success: false}
               deferred.resolve(response);
        });
        return deferred.promise;
    }
    //Allows users and admins to update user details
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
    firebaseConnection.deactivateBoard = function(boardId){
        fb_reference.child('boards').child(boardId).child('active').set(false);
    }
    firebaseConnection.reactivateBoard = function(boardId){
        fb_reference.child('boards').child(boardId).child('active').set(true);
    }
    firebaseConnection.deleteBoard = function(boardId){
        fb_reference.child('boards').child(boardId).remove();
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
    
    // tests Firebase connection to determine if integration with storyteller was successful
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
        });
        return deferred.promise;
    };
    /* board methods */
    
    firebaseConnection.createStatus = function createStatus(boardRef, statusObj, cb) {
        var ref = boardRef
            .child('statuses')
            .push({
                name: statusObj.name || 'unnamed',
                order: statusObj.order || 2,
                color: statusObj.color || '#AFA',
                deletable: statusObj.deletable,
                display: statusObj.display,
                allow_before: statusObj.allow_before
            })
        ref.then(function(){cb(ref);});
    }
    
    firebaseConnection.shiftStatusOrdersIfConflict = function shiftStatusOrders(boardRef, greaterThan, cb) {
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
                    .once('value', function(matching_snap) {
                      var remaining = matching_snap.numChildren();
                      if (remaining == 0)
                        cb();
                      else {
                        var decr = function() {
                          if (--remaining == 0)
                            cb();
                        }
                        matching_snap.forEach(function(element) {
                          boardRef
                            .child('statuses')
                            .child(element.key)
                            .update({
                              order: element.val().order + 1
                            })
                            .then(decr);
                        });
                      }
                    });
            })
    }
    
    firebaseConnection.pullStatusOrdersForward = function(boardRef, greaterThan, cb) {
      boardRef
        .child('statuses')
        .orderByChild('order')
        .startAt(greaterThan)
        .once('value', function(matching_snap) {
          var remaining = matching_snap.numChildren();
          if (remaining == 0)
            cb();
          else {
            var decr = function() {
              console.log('iter pull (' + remaining + ')')
              if (--remaining == 0)
                cb();
            }
            matching_snap.forEach(function(element) {
              console.log("subtracting 1 from " + element.val().name + " (" + element.val().order + ")");
              boardRef
                .child('statuses')
                .child(element.key)
                .update({
                  order: element.val().order - 1
                })
                .then(decr);
            });
          }
        });
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
            display: true,
            allow_before: false
        });
        firebaseConnection.createStatus(boardRef, {
            name: 'under consideration',
            order: 2,
            color: '#88F',
            deletable: false,
            display: true,
            default: true,
            allow_before: true
        });
        firebaseConnection.createStatus(boardRef, {
            name: 'discarded',
            color: '#FFF',
            deletable: false,
            display: false,
            allow_before: false
        });
        return boardRef;
    };
    
    firebaseConnection.getBoards = function(){
        return fb_reference
            .child('boards').orderByChild('active').equalTo(true);
    }
	firebaseConnection.getStories = function(boardId){
		var deferred = $q.defer()
		fb_reference.child('boards').child(boardId).child('stories').once('value',function(snap){
			deferred.resolve(snap);
		});
		return deferred.promise;
	}
    firebaseConnection.getInactiveBoards = function(){
        return fb_reference
            .child('boards').orderByChild('active').equalTo(false);
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