angular.module('app').component('login',{
	templateUrl: '/public/login.html',
	controllerAs: 'vm',
	controller: function($timeout,$location,firebaseConnection,$timeout,$location){
	var vm = this;
	vm.authFailed = false;
	vm.connected = false;
	vm.showLogin = true;
	vm.connectionString;
	//.firebaseConnection.createUserProfile();
	//firebaseConnection.authorize('admin@storyteller.com','abc123def0');
	vm.userLogin;
	vm.userRegister; 
	resetLogin = function(){
		vm.userLogin= {
			email: null,
			password: null
		}
	}
	resetRegister = function(){
		vm.userRegister = {
			email: null,
			firstName: null,
			lastName: null,
			password: null,
			confirmPassword: null
		}
	}
	vm.submitRegister = function(){
		if(vm.userRegister.password === vm.userRegister.confirmPassword){
			vm.userRegister.name = vm.userRegister.firstName +" "+vm.userRegister.lastName;
		firebaseConnection.register(vm.userRegister).then(function(res){
			console.log(res);
			if(res.success){
				$location.path('/home');
			}
			else{
				resetRegister();
				console.log('Registration was unsuccesful');
			}
			
		});
		}
	}
	vm.submitAuth = function(){
		if(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(vm.userLogin.email)){
		firebaseConnection.authorize(vm.userLogin.email,vm.userLogin.password).then(function(res){
			if(res.success){
				console.log(firebaseConnection.sessionStore.currentUser);
				$location.path('/home');
		}
			else{
			vm.authFailed = !res.success;
			vm.errorMessage = 'The credentails entered are invalid, please try again.'
			}
		});
		}
		else{
			vm.authFailed = true;
			vm.errorMessage = 'Please enter a valid email address';
		}
		vm.userLogin = {
			email: null,
			password: null
		};
	}
	vm.testConnection = function() {
		firebaseConnection.testFirebaseConnection().then( function(res){
			$timeout(function(){
				vm.connectionString = res.ref;
				vm.connected = res.connected;
			});
		});
	};
	vm.onClick_showLogin = function(){
		console.log('Yeh')
		vm.showLogin = true;
		$('register-form-link').removeClass('active');
		$('login-form-link').addClass('active');
	}
	vm.onClick_showRegister = function(){
		console.log('nah')
		$timeout(()=>{vm.showLogin = false;
		$('login-form-link').removeClass('active');
		$('register-form-link').addClass('active');
		});
	}
}
});
