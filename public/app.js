angular
.module('app',['ngRoute','firebase']).config(config);

function config($routeProvider){
	$routeProvider
    //Route defined for login page
	.when('/login',{
		template: '<login></login>'
	})
	//Route defined for the user's home page
    .when('/home',{
        template: '<home></home>'
    })
	//Route defined for boards
    .when('/board',{
        template: '<board></board>'
    })
	//Default back to login
    .otherwise('/board');
}
