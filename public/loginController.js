angular.module('app').component('login',{
	templateUrl: '/public/login.html',
	controllerAs: 'vm',
	controller: function($timeout,$location,firebaseConnection){
	var vm = this;
	vm.connected = false;
	vm.connectionString;
	//.firebaseConnection.createUserProfile();
	vm.testConnection = function() {
		firebaseConnection.testFirebaseConnection().then( function(res){
			$timeout(function(){
				vm.connectionString = res.ref;
				vm.connected = res.connected;
			});
		});
	};
}
});
