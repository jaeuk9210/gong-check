var express = require('express');
var router = express.Router();
var Book = require('../models/Book');
var Post = require('../models/Post');
var util = require('../util');
var csv = require('fast-csv');
var fs = require('fs');
var mongoose = require('mongoose');
var cheerio = require('cheerio-httpcli');
var config = require('../config/config.json');
var request = require('request');
var xml2js = require('xml-js');
var urlType = require('url');



//책 리스트 페이지
router.get('/', async function(req, res){
  //page구분
  var page = Math.max(1, parseInt(req.query.page));
  var limit = Math.max(1, parseInt(req.query.limit));
  page = !isNaN(page)?page:1;
  limit = !isNaN(limit)?limit:10;

  var kdc = !isNaN(req.query.kdc)?req.query.kdc:"";

  var searchQuery = createSearchQuery(req.query);
  
  //DB검색 후 출력
  
  var skip = (page - 1) * limit;
  var count = await Book.countDocuments(searchQuery);

  var maxPage = Math.ceil(count/limit);
  var books = await Book.find(searchQuery)
    .sort('kdc')
    .sort('title')
    .skip(skip)
    .limit(limit)
    .exec();

  res.render('books/index', {
    books:books,
    currentPage:page,
    maxPage:maxPage,
    limit:limit,
    searchType:req.query.searchType,
    searchText:req.query.searchText,
    kdc: kdc
  });
});

//책 등록 페이지
router.get('/new', util.isLoggedin, function(req, res){
  res.render('books/new');
})

//책 등록 api
router.post('/', util.isLoggedin, function(req, res){
  req.body.author = req.user._id;
  Book.create(req.body, function(err, book){
    if(err) return res.json(err);
      res.redirect('/books'+res.locals.getPostQueryString(false, { page:1, searchText:'' }));
  });
});

//책 개별 페이지
router.get('/:id', async function(req, res){
  var fbook = await Book.findOne({_id:req.params.id})
    .exec();
  
  if(isNaN(fbook.isParsed)||!fbook.isParsed) {
    //네어버 api 요청 옵션
    const n_url = "https://openapi.naver.com/v1/search/book_adv.xml"
    const n_options = {
      uri: n_url,
      qs:{
        display:1,
        d_auth:fbook.author,
        d_titl:fbook.title,
        d_publ:fbook.publisher
      },
      headers: {
        'X-Naver-Client-Id': config.NAVER_API_CLIENT_ID,
        'X-Naver-Client-Secret': config.NAVER_API_CLIENT_SECRET
      }
    };

    const nl_url = "https://www.nl.go.kr/NL/search/openApi/search.do"
    const nl_options={
      uri: nl_url,
      qs: {
        key: config.NATIONAL_LIB_API_KEY,
        kwd:fbook.title,
        detailSearch:true,
        f1:"title",
        v1:fbook.title,
        f2:"author",
        v2:fbook.author,
        f3:"publisher",
        v3:fbook.publisher,
        systemType:"오프라인자료",
        pageSize:1
      }
    }
    //api요청
    request(n_options, async function(err, response, body) {
      var img = "";
      var intro = "";
      var year = "";
      var isbn = "";
      var result = xml2js.xml2json(body, {compact: true, spaces: 4});
      
      //console.log(result);

      result = JSON.parse(result);
      
      if (result.rss.channel.total._text == "0") {
        img = "/imgs/nocover";
        intro = "책 설명이 등록되어 있지 않습니다.";
      } else {
        img = result.rss.channel.item.image._text;
        
        if(img) {
          img = img.split("?");
          img = img[0];
        } else {
          img = "/imgs/nocover";
        }

        intro = result.rss.channel.item.description._text;
        if(intro){
          intro = util.removeHTML(intro);
          intro = util.replaceAll(intro, "&lt;", "<");
          intro = util.replaceAll(intro, "&gt;", ">");
          intro = util.replaceAll(intro, "&#x0D;", "");
        } else {
          intro = "책 설명이 등록되어 있지 않습니다."
        }

        year = result.rss.channel.item.pubdate._text;
        if(year) {
          year = year.substring(0, 4);
        } else {
          year = "";
        }

        isbn = result.rss.channel.item.isbn._text;
        if(isbn) {
          isbn = isbn.split(" ");
          isbn = isbn[1];
        } else {
          isbn = "";
        }
      }
      
      fbook.cover = img;
      fbook.intro = intro;
      fbook.isbn = isbn;
      fbook.year = year;

      request(nl_options, async function(err, response, body) {
        if(response.statusCode == 200) {
          body = body.replace(/\&/g,'');
          console.log(body);
          var nl_result = xml2js.xml2json(body, {compact: true, spaces: 4});

          nl_result = JSON.parse(nl_result);

          if(nl_result.root.paramData.total._text != 0) {
            fbook.kdc = nl_result.root.result.item.class_no._cdata;
          }
        }
        fbook.isParsed = true;

        await Book.findOneAndUpdate({_id:req.params.id}, fbook, function(err, book){
          if(err) return res.json(err);
        });
      });
    });
    return res.redirect('/books/'+req.params.id+res.locals.getPostQueryString());
  }

  var postForm = req.flash('postForm')[0] || {_id: null, form: {}};
  var postError = req.flash('postError')[0] || {_id: null, errors: {}};

  Promise.all([
    Book.findOne({_id:req.params.id}),
    Post.find({book:req.params.id}).sort('createdAt').populate({path:'author', select:'username'})
  ])
  .then(([book, posts]) => {
    res.render('books/show', {book:book, posts:posts, postForm:postForm, postError:postError});
  })
  .catch((err) => {
    console.log('err: ', err);
    return res.json(err);
  });
});

//책 정보 수정
router.get('/:id/edit',  function(req, res){
  Book.findOne({_id:req.params.id}, function(err, book){
    if(err) return res.json(err);
    res.render('books/edit', {book:book});
  });
});

//책 정보 수정 api
router.put('/:id', function(req, res){
  req.body.updatedAt = Date.now();
  Book.findOneAndUpdate({_id:req.params.id}, req.body, function(err, book){
    if(err) return res.json(err);
    res.redirect("/books/"+req.params.id+res.locals.getPostQueryString());
  });
});

//책 삭제 api
router.delete('/:id', function(req, res){
  Book.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/books'+res.locals.getPostQueryString());
  });
});

module.exports = router;

function createSearchQuery(queries){ // 4
  var searchQuery = {};
  if(queries.searchText && queries.searchText.length >= 2 || queries.kdc){
    
    if(queries.searchType){
      var searchTypes = queries.searchType.toLowerCase().split(',');
    } else if (queries.searchText) {
      var searchTypes = "title";
    }
    var postQueries = [];

    var kdc = queries.kdc;
    if(!isNaN(kdc) && parseInt(kdc)>=100) {
      kdc = kdc.split("0").join("[0-9]");
      var kdcquery = new RegExp("^("+kdc+")");
    } else if (!isNaN(kdc)) {
      kdc = String(parseInt(kdc))
      kdc = kdc.split("0").join("[0-9]");
      var kdcquery = new RegExp("^(0"+kdc+")");
    } else {
      var kdcquery = new RegExp("");
    }

    if(searchTypes){
      if(searchTypes.indexOf('title')>=0){
        postQueries.push({ title: { $regex: new RegExp(queries.searchText, 'i') } });
      }
      if(searchTypes.indexOf('body')>=0){
        postQueries.push({ intro: { $regex: new RegExp(queries.searchText, 'i') } });
      }
    }

    if(queries.kdc){
      postQueries.push({ kdc: kdcquery });
    }
    if(postQueries.length > 0) searchQuery = {$or:postQueries};
  }
  return searchQuery;
}