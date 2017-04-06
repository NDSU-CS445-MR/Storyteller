var express = require('express');
var firebase = require('firebase');
var child_process = require('child_process');
var app = express();
var http = require('http').Server(app);
var config = require('./config.json');
var fb_config = require("./public/fb-config.js").fb_configRef();
firebase.initializeApp(fb_config);

var fb_ref = firebase.database().ref();

var child = child_process.fork('./analysis/dispatch');
child.send({head:"fbRef",data: fb_config});
app.use('/public',express.static(__dirname+'/public'));
app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});

http.listen(config.butts, function(){
	console.log('listening on *:' + config.butts);
});
