angular
    .module('app',['ngCookies','ngRoute','firebase'])
    .config(config);

function config($routeProvider){

    $routeProvider
        // Route defined for boards
        .when('/board',{
            template: '<board></board>',
        })
        // Route defined for the user's home page
        .when('/dashboard',{
            template: '<dashboard></dashboard>',
        })
        // Route defined for login page
        .when('/login',{
          template: '<login></login>',
        })
        // Default back to board
        .otherwise('/login');
}