var marked = require('marked');
var level = require("level");

var db = level("db", { valueEncoding: 'json' });

var getAllPost = function(fn) {
  var posts = [];
  db.createReadStream({
    start   : "post:" + "\xFF",
    end     : "post:",
    reverse : true,
  })
  .on('data', function (data) {
    var post = data.value;
    post = formatPost(post);
    console.log(post.deleted);
    if (post.deleted) {
      return;
    }
    posts.push(post);
  })
  .on('error', function(err) {
    fn(err, undefined);
  })
  .on('close', function () {
    fn(undefined, posts);
  });
};

var deletePost = function(postId, fn) {
  var key = 'post:' + postId;
  db.get(key, function(err, post) {
    if (err) {
      return fn(err);
    }
    if (post.deleted) {
      return fn();
    }
    post.deleted = true;
    db.put(key, post, function(err) {
      return fn(err);
    });
  });
};

var formatPost = function(post) {
  var date = new Date(post.timestamp);
  post.date = "" + date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate();
  post.content = marked(post.content);
  return post;
};

exports.db = db;
exports.getAllPost = getAllPost;
exports.formatPost = formatPost;
exports.deletePost = deletePost;
