var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: 'uploadedfiles/' });
var Post = require('../models/Post');
var Book = require('../models/Book');
var File = require('../models/File');
var util = require('../util');

router.post('/', util.isLoggedin, upload.single('attachment'), checkBookId, async function(req, res) {
  var attachment = req.file?await File.createNewInstance(req.file, req.user._id):undefined; // 4-2

  console.log(attachment);

  req.body.attachment = attachment;

  var book = res.locals.book;

  req.body.author = req.user._id;
  req.body.book = book._id;

  Post.create(req.body, function(err, post){
    if(err){
      req.flash('postForm', { _id: null, form:req.body });
      req.flash('postError', { _id: null, errors:util.parseError(err) });
    }
    if(attachment) {
      attachment.postId = post._id;
      attachment.save();
    }
    return res.redirect('/books/'+book._id+res.locals.getPostQueryString());
  });
});

router.get('/new', util.isLoggedin, checkBookId, function(req, res) {
  var book = res.locals.book;

  var post = req.flash('post')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('posts/new', { book:book, post:post, errors:errors });
})

router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
  var post = req.flash('post')[0];
  var errors = req.flash('errors')[0] || {};
  if(!post){
    Post.findOne({_id:req.params.id})
      .populate({path:'attachment',match:{isDeleted:false}})
      .exec(function(err, post){
        if(err) return res.json(err);
        res.render('posts/edit', { post:post, errors:errors });
      });
  } else {
    post._id = req.params.id;
    res.render('posts/edit', { post:post, errors:errors });
  }
});

router.get('/:id', function(req, res){
  Post.findOne({_id:req.params.id})
    .populate('author')
    .populate('book')
    .populate({path:'attachment',match:{isDeleted:false}})
    .exec(function(err, post){
      if(err) return res.json(err);
      res.render('posts/show', {post:post});
    });
});

router.post('/:id/like', util.isLoggedin, function(req, res){
  console.log("like");
  Post.findByIdAndUpdate(req.params.id, {
    $push:{likes:req.user._id}
  }, {
    new:true
  }).exec((err, result)=>{
    return res.redirect('/posts/'+req.params.id);
  });
});

router.post('/:id/unlike', util.isLoggedin, function(req, res){
  Post.findByIdAndUpdate(req.params.id, {
    $pull:{likes:req.user._id}
  }, {
    new:true
  }).exec((err, result)=>{
    return res.redirect('/posts/'+req.params.id);
  });
});

router.put('/:id', util.isLoggedin, checkPermission, upload.single('newAttachment'), async function(req, res){
  var post = await Post.findOne({_id:req.params.id}).populate({path:'attachment',match:{isDeleted:false}});
  if(post.attachment && (req.file || !req.body.attachment)){
    post.attachment.processDelete();
  }
  req.body.attachment = req.file?await File.createNewInstance(req.file, req.user._id, req.params.id):post.attachment;
  req.body.updatedAt = Date.now();
  Post.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
    if(err) {
      req.flash('post', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/posts/'+req.params.id+'/edit');
    }
    res.redirect("/posts/"+req.params.id);
  });
});

router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
  Post.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/');
  });
});

module.exports = router;

function checkBookId(req, res, next){ // 1
  Book.findOne({_id:req.query.bookId},function(err, book){
    if(err) return res.json(err);

    res.locals.book = book;
    next();
  });
}

function checkPermission(req, res, next){
  Post.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}