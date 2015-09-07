var Twit = require('twit');
var io = require('../app').io;
var TWEETS_BUFFER_SIZE = 3;
var SOCKETIO_TWEETS_EVENT = 'tweet:tweets';
var SOCKETIO_START_EVENT = 'tweet:start';
var SOCKETIO_STOP_EVENT = 'tweet:stop';
var nbOpenSockets = 0;
var isFirstConnectionToTwitter = true;

var T = new Twit({
    consumer_key:         'vJD82vdHpb3QyQwIC6ycmdFAL',
    consumer_secret:      'rcdQsCnbckLq2JQRxPCaK84ZDYvYs6PvkaykvUS85Xr5GREMfz',
    access_token:         '444052298-dAmnIwWf51mlpNtQDi9GCiBGQUAE9lPQXHR7vgHc',
    access_token_secret:  'YheEYKey3hK1a2fVynnnxQtpUShR6JvV8NBrRyzjkxKgp'
})

console.log("Listening to tweets from all around the world...");
var stream = T.stream('statuses/sample')

var tweetsBuffer = [];
var oldTweetsBuffer = [];

//Handle Socket.IO events
var discardClient = function() {
	console.log('Client disconnected !');
	nbOpenSockets--;

	if (nbOpenSockets <= 0) {
		nbOpenSockets = 0;
		console.log("No active client. Stop streaming from Twitter");
		stream.stop();
	}
};

var handleClient = function(data, socket) {
	if (data == true) {
		console.log('Client connected !');
		
		if (nbOpenSockets <= 0) {
			nbOpenSockets = 0;
			console.log('First active client. Start streaming from Twitter');
			stream.start();
		}

		nbOpenSockets++;

		//Send previous tweets buffer to the new client.
		if (oldTweetsBuffer != null && oldTweetsBuffer.length != 0) {
			socket.emit(SOCKETIO_TWEETS_EVENT, oldTweetsBuffer);
		}
	}
};

io.sockets.on('connection', function(socket) {

	socket.on(SOCKETIO_START_EVENT, function(data) {
		handleClient(data, socket);
	});

	socket.on(SOCKETIO_STOP_EVENT, discardClient);

	socket.on('disconnect', discardClient);
});


//Handle Twitter events
stream.on('connect', function(request) {
	console.log('Connected to Twitter API');

	if (isFirstConnectionToTwitter) {
		isFirstConnectionToTwitter = false;
		stream.stop();
	}
});

stream.on('disconnect', function(message) {
	console.log('Disconnected from Twitter API. Message: ' + message);
});

stream.on('reconnect', function (request, response, connectInterval) {
  	console.log('Trying to reconnect to Twitter API in ' + connectInterval + ' ms');
});

stream.on('tweet', function(tweet) {
	if (tweet.place == null) {
		return ;
	}

	//Create message containing tweet + location + username + profile pic
	var msg = {};
	msg.text = tweet.text;
	msg.location = tweet.place.full_name;
	msg.user = {
		name: tweet.user.name, 
		image: tweet.user.profile_image_url
	};


	//push msg into buffer
	tweetsBuffer.push(msg);

	broadcastTweets();
});

var broadcastTweets = function() {
	//send buffer only if full
	if (tweetsBuffer.length >= TWEETS_BUFFER_SIZE) {
		//broadcast tweets
		io.sockets.emit(SOCKETIO_TWEETS_EVENT, tweetsBuffer);
		
		oldTweetsBuffer = tweetsBuffer;
		tweetsBuffer = [];
	}
}