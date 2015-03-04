var gulp = require('gulp');
var sketch = require('gulp-sketch');
var connect = require('gulp-connect');
var clean = require('gulp-rimraf');
var Twit = require('twit')

var serverPort = 8080;


gulp.task('clean', function(cb) {
  gulp.src('./s23/images/*').pipe(clean())
});

gulp.task('sketchtool', function() {
  return gulp.src('./s23/sketch/*.sketch')
    .pipe(
      sketch({
        export: 'slices',
        outputJSON: 'index.json',
        saveForWeb: true,
        groupContentsOnly: true
      })
    )
    .pipe(gulp.dest('./s23/images'));
});

gulp.task('sketch', ['clean', 'sketchtool']);

gulp.task('connect', function() {
  connect.server();
});

gulp.task('express', function() {
  var express = require('express');
  var app = express();
  app.use(express.static(__dirname));

  var tweets = [];
  var cacheTweets = 15;

  var T = new Twit(require('./appKeys/twitter').getKeys());


  var stream = T.stream('statuses/filter', { track: '#GDC2015' })

  stream.on('error', function(e) {
    console.log(e);
  })

  stream.on('tweet', function (tweet) {
    io.sockets.emit('tweet', {
      user: tweet.user.screen_name,
      text: tweet.text
    })

    if (tweets.length > cacheTweets) {
      tweets.shift();
    }

    tweets.push(tweet);
  })

  app.get('/tweets', function(req, res) {
    res.send(tweets);
  })

  var server = app.listen(serverPort);

  var io = require('socket.io').listen(server);

  console.log('Listening on port ' + serverPort);
})

gulp.task('default', ['express']);
