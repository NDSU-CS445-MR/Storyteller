angular.module('app').component('home',{
	templateUrl: '/public/home.html',
	controllerAs: 'vm',
	controller: function(firebaseFactory){
		var vm = this;
		vm.user = firebaseFactory.sessionStore.currentUserKey;
	}

});