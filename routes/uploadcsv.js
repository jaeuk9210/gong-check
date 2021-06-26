var express = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: 'uploadedcsvs/' });
var Book = require('../models/Book');
var Csv = require('../models/CSV');
var util = require('../util');
var csvtojson = require('csvtojson');
var mongodb = require('mongodb').MongoClient
var config = require('../config/config.json')

router.post('/', util.isLoggedin, upload.single('attachment'), async function(req, res) {
  console.log(req.file)
  csvtojson()
  .fromFile(req.file.path)
  .then(csvData => {
    console.log(csvData);

    mongodb.connect(
      config.MONGO_DB,
      { useNewUrlParser: true, useUnifiedTopology: true },
      (err, client) => {
        if (err) throw err;

        client
          .db("myFirstDatabase")
          .collection("books")
          .insertMany(csvData, (err, res) => {
            if (err) throw err;

            console.log(`Inserted: ${res.insertedCount} rows`);
            client.close();
          });
      }
    );

    return res.redirect('/books');
  });
});

router.get('/', util.isLoggedin, function(req, res) {
  var book = res.locals.book;

  var post = req.flash('post')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('books/uploadcsv', { book:book, post:post, errors:errors });
})

module.exports = router;

function checkPermission(req, res, next){
  Post.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    if(post.author != req.user.id) return util.noPermission(req, res);

    next();
  });
}