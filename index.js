var express = require("express");
var morgan = require("morgan");

var app = express();

app.use(morgan('dev'));
app.use("/static", express.static(__dirname + '/public'));

app.get("/ping", function(req, res) {
  res.send("pong");
});

app.get(["/", "/posts"], function(req, res){
  res.render("posts.ejs", {});
});

app.get("/post/:id", function(req, res){

});

var server = app.listen(3001, function() {
  console.log('Listening on port %d', server.address().port);
});
