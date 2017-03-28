var express = require('express');
var app = express();
var http = require('http').Server(app);
var config = require('./config.json');

app.use('/public',express.static(__dirname+'/public'));
app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});
http.listen(config.port, function(){
	console.log('listening on *:' + config.port);
});
