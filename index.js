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

var formatPost = function(post) {
  var date = new Date(post.timestamp);
  post.date = "" + date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate();
  post.content = marked(post.content);
  return post;
}

app.get("/ping", function(req, res) {
  res.send("pong");
});

app.get(["/", "/posts"], function(req, res) {
  var posts = [];
  db.createReadStream({
    start : "post:",
    end   : "post:" + "\xFF",
  })
  .on('data', function (data) {
    var post = data.value;
    post = formatPost(post);
    posts.push(post);
  })
  .on('error', function(err) {
    res.status(500).send(err.toString());
  })
  .on('close', function () {
    res.render("posts.ejs", { posts: posts });
  });
});

app.get("/post/:id", function(req, res) {
  var id = parseInt(req.param("id"), 36);
  db.get("post:" + id, function(err, post) {
    if (err) {
      res.status(500).send(err.toString());
      return;
    }
    post = formatPost(post);
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
    res.redirect("/post/" + timestamp.toString(36));
  });
});

var server = app.listen(3001, function() {
  console.log('Listening on port %d', server.address().port);
});
