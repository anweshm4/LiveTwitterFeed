var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  ,Twit = require('twit')
  , io = require('socket.io').listen(server);
  
server.listen(3000)
  
// routing
app.get('/', function (req, res) {
res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/'));

 
var T = new Twit({
    consumer_key:         'vJD82vdHpb3QyQwIC6ycmdFAL',
    consumer_secret:      'rcdQsCnbckLq2JQRxPCaK84ZDYvYs6PvkaykvUS85Xr5GREMfz',
    access_token:         '444052298-dAmnIwWf51mlpNtQDi9GCiBGQUAE9lPQXHR7vgHc',
    access_token_secret:  'YheEYKey3hK1a2fVynnnxQtpUShR6JvV8NBrRyzjkxKgp'
})

io.sockets.on('connection', function (socket) {
  	console.log('Connected');

	console.log("Listening to tweets from all around the world...");
	var stream = T.stream('statuses/sample')
	var tweetsBuffer = [];
 
	stream.on('connect', function(request) {
    	console.log('Connected to Twitter API');
	});
 
	stream.on('disconnect', function(message) {
    	console.log('Disconnected from Twitter API. Message: ' + message);
	});
 
	stream.on('reconnect', function (request, response, connectInterval) {
  	  console.log('Trying to reconnect to Twitter API in ' + connectInterval + ' ms');
	})
 
	stream.on('tweet', function(tweet) {
    	if (tweet.geo == null) {
        	return ;
    	}
 
    	//Create message containing tweet + username + profile pic + geo
    	var msg = {};
    	msg.text = tweet.text;
    	msg.geo = tweet.geo.coordinates;
    	msg.user = {
        	name: tweet.user.name,
        	image: tweet.user.profile_image_url
    	};
 
    	io.sockets.emit('username', tweet.user.name);
    	io.sockets.emit('image', tweet.user.profile_image_url);
    	io.sockets.emit('tweet', tweet.text);
		
		//console.log(msg);
	})
});