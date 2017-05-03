var express = require('express');
var firebase = require('firebase');
var child_process = require('child_process');
var app = express();
var http = require('http').Server(app);
var config = require('./config.json');
var fb_config = require("./public/fb-config.js").fb_configRef();
firebase.initializeApp(fb_config);

var fb_ref = firebase.database().ref();

var childProcesses = [];
var counter = 0;

var startAnalysis = function(){
	//Spawns board dispatcher for all active boards
	fb_ref.child('boards').orderByChild("active").equalTo(true).once('value',function(snap){
		snap.forEach(function(board){
			console.log(board.key);
			childProcesses.push(child_process.fork('./analysis/dispatch'));
			childProcesses[counter++].send({head:"fbRef",data:board.key});
		});
	});
	//listens for additon of new boards and spawns board dispatcher when they are created
	fb_ref.child('newBoards').on('value',function(snap){
		snap.forEach(function(boardKey){
			childProcesses.push(child_process.fork('./analysis/dispatch'));
			childProcesses[counter++].send({head:"fbRef",data:boardKey.val()});
			fb_ref.child('newBoards').child(boardKey.key).remove();
		});
	});
}

startAnalysis()

app.use('/public',express.static(__dirname+'/public'));
app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});

http.listen(config.port, function(){
	console.log('listening on *:' + config.port);
});
