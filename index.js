var express = require("express");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var level = require("level");
var session = require('express-session');
var weibo = require('weibo');

var models = require("./models");

var sinaConfig = {
  appkey: '895398235',
  secret: '226f7a63ce6ced164db6b74979ee5345',
  callbackUrl: 'http://slintta.com/callback',
};

weibo.init('weibo', sinaConfig.appkey, sinaConfig.secret, sinaConfig.callbackUrl);

var app = express();
app.use(morgan('dev'));
app.use("/static", express.static(__dirname + '/public'));
app.use(session({
  secret: 'you know nothing',
  resave: true,
  saveUninitialized: true,
}));
app.use(bodyParser.urlencoded({
  extended: false,
}));
app.use(weibo.oauth({
  loginPath: '/login',
  logoutPath: '/logout',
  afterLogin: function(req, res, next) {
    console.log(req.session.oauthUser);
    next();
  },
  beforeLogout: function(req, res, next) {
    next();
  },
}));

app.get("/ping", function(req, res) {
  res.send("pong");
});

app.get("/", function(req, res) {
  res.render("index.ejs");
});

app.get("/posts", function(req, res) {
  models.getAllPost(function(err, posts) {
    if (err) {
      res.status(500).send(err.toString());
      return;
    }
    res.render("posts.ejs", {
      posts: posts,
      user: req.session.oauthUser,
    });
  });
});

app.get("/post/:id", function(req, res) {
  var id = parseInt(req.param("id"), 36);
  models.db.get("post:" + id, function(err, post) {
    if (err) {
      res.status(500).send(err.toString());
      return;
    }
    
    models.getAllPost(function(err, posts) {
      if (err) {
        res.status(500).send(err.toString());
      }
      post = models.formatPost(post);
      res.render("post.ejs", {
        post: post, posts: posts,
        user: req.session.oauthUser,
      });
    });
  });
});

app.get("/post/:id/edit", function(req, res) {

});

app.get("/posts/new", function(req, res) {
  res.render("post_edit.ejs", {
    post: undefined,
    user:req.session.oauthUser,
  });
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
  };
  models.db.put("post:" + timestamp, post, function(err) {
    if (err) {
      res.status(500).send(err.toString());
      return;
    }
    res.redirect("/post/" + timestamp.toString(36));
  });
});

var server = app.listen(80, function() {
  console.log('Listening on port %d', server.address().port);
});
