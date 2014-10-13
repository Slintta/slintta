var express = require("express");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var level = require("level");
var marked = require('marked');

var db = level("db", { valueEncoding: 'json' });

var app = express();
app.use(morgan('dev'));
app.use("/static", express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/ping", function(req, res) {
  res.send("pong");
});

app.get(["/", "/posts"], function(req, res) {
  res.render("posts.ejs", {});
});

app.get("/post/:id", function(req, res) {
  var id = req.param("id");
  db.get("post:" + id, function(err, post) {
    if (err) {
      res.status(500).send(err.toString());
      console.log(err);
      return;
    }
    post.content = marked(post.content);
    res.render("post.ejs", { post: post });
  });
});

app.get("/post/:id/edit", function(req, res) {

});

app.get("/posts/new", function(req, res) {
  res.render("post_edit.ejs", { post: undefined });
});

app.post("/posts/new", function(req, res) {
  var title = req.param("title");
  var content = req.param("content");
  if (title === undefined || content === undefined) {
    res.status(406).send("invalid params");
    return;
  }
  var timestamp = (new Date()).getTime();
  var post = {
    title: title,
    content: content,
    timestamp: timestamp,
  }
  db.put("post:" + timestamp, post, function(err) {
    if (err) {
      res.status(500).send(err.toString());
      return;
    }
    res.redirect("/post/" + timestamp);
  });
});

var server = app.listen(3001, function() {
  console.log('Listening on port %d', server.address().port);
});
