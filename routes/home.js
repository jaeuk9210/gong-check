var express = require('express');
var router = express.Router();
var Book = require('../models/Book');
var Post = require('../models/Post');
var passport = require('../config/passport');
var util = require('../util');

router.get('/', async function(req, res) {
	//진중문고 5개 랜덤 추출
	var jinjung = await divisionBook('진중문고');
	//국방전자도서관 5개 랜덤 추출
	var ebook = await divisionBook('국방전자도서관');
	var dodlib = await divisionBook('국방전자도서관');

  var rank = await Post.aggregate([
    {
      $group : {
        _id: "$book",
        num_post : {$sum:1},
        reviews_title : {$push : "$title"},
        reviews_id : {$push : "$_id"}
      }
    },
    {
      $sort : {num_post :-1}
    },
    { $limit: 3 },
    {
      $lookup : {
        "from": "books",
        "localField": "_id",
        "foreignField": "_id",
        "as": "books"
      }
    }
  ]);

	var review=[];
	if (req.isAuthenticated()) {
    Promise.all([
      Post.find({ author: req.user.id }).populate('book')
    ])
    .then(([review]) => {
      res.render('home/index', {
        jinjung: jinjung,
        ebook: ebook,
        dodlib: dodlib,
        rank: rank,
        post: review
      });
    })
    .catch((err) => {
      console.log('err: ', err);
      return res.json(err);
    });
	} else {
    res.render('home/index', {
      jinjung: jinjung,
      ebook: ebook,
      dodlib: dodlib,
      rank: rank,
      post: review
    });
  }
});

router.get('/login', function(req, res) {
	var username = req.flash('username')[0];
	var errors = req.flash('errors')[0] || {};
	res.render('home/login', {
		username: username,
		errors: errors
	});
});

router.post(
	'/login',
	function(req, res, next) {
		var errors = {};
		var isValid = true;

		if (!req.body.username) {
			isValid = false;
			error.username = 'Username is required!';
		}
		if (!req.body.password) {
			isValid = false;
			errors.password = 'Password is required!';
		}

		if (isValid) {
			next();
		} else {
			req.flash('errors', errors);
			res.redirect('/login');
		}
	},
	passport.authenticate('local-login', {
		successRedirect: '/books',
		failureRedirect: '/login'
	})
);

router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

module.exports = router;

async function divisionBook(type) {
	var book = await Book.aggregate(
		[{ $match: { type: RegExp('(' + type + ')$') } }, { $sample: { size: 5 } }],
		function(err, result) {
			if (err) {
				req.flash('Error', { _id: null, errors: util.parseError(err) });
			} else {
				book = result;
			}
		}
	);
	return book;
}
