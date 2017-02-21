/*global firebase:true*/
/*eslint no-undef: 2*/

	
angular.module('app').factory('firebaseFactory', function($q){
    var databaseFactory = {};
    databaseFactory.testFirebaseConnection = function(){
        var firebaseRef = firebase.database().ref();
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
    return databaseFactory;
});