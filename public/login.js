angular.module('app').component('login',{
	templateUrl: '/public/login.html',
	controllerAs: 'vm',
	controller: function($timeout,$location,firebaseFactory){
	var vm = this;
	vm.connected = false;
	vm.connectionString;
	//.firebaseFactory.createUserProfile();
	vm.testConnection = function() {
		firebaseFactory.testFirebaseConnection().then( function(res){
			$timeout(function(){
				vm.connectionString = res.ref;
				vm.connected = res.connected;
			});
		});
	};
}
});
