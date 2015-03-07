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
    if (post.deteleted) {
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
