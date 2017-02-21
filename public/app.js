angular
.module('app',['ngRoute','firebase']).config(config)
.controller('LoginController', function($timeout,$location,firebaseFactory){
	var vm = this;
	vm.connected = false;
	vm.connectionString;
	vm.testConnection = function() {
		firebaseFactory.testFirebaseConnection().then( function(res){
			$timeout(function(){
				vm.connectionString = res.ref;
				vm.connected = res.connected;
			});
		});
	};
});
function config($routeProvider){
	$routeProvider
    .when('/login',{
		template: '<login></login>'
	})
    .when('/home',{
        template: '<home></home>'
    })
//     .when('/session',{
//             template: "<session></session>"
//     })
        .otherwise('/login');
}