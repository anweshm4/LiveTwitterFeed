appControllers.controller('TweetCtrl', ['$scope', 'socket',
	function TweetCtrl ($scope, socket) {
		
		$scope.tweets = [];
		$scope.btnIsDisabled = false;
		$scope.btnText = "Stream Tweets From All Around The World"

		$scope.findTweets = function findTweets() {

			socket.emit('tweet:start', true);

			$scope.btnText = "Streaming Tweets . . .";
			$scope.btnIsDisabled = true;

			socket.on('tweet:tweets', function (data) {
			    $scope.tweets = $scope.tweets.concat(data);
			});			
		}
	}
]);
