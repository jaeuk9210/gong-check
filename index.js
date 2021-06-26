var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var session = require('express-session');
var config = require('./config/config.json');
var mongodb = require('mongodb');
var passport = require('./config/passport');
var util = require('./util');
var cheerio = require("cheerio-httpcli");
var request = require('request');
var xml2js = require('xml-js');
var fs = require('fs');
var app = express();


mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(config.MONGO_DB);
var db = mongoose.connection;

db.once('open', function(){
  console.log('DB connected');
});

db.on('error', function(err){
  console.log('DB ERROR : ', err);
});

app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(flash());
app.use(session({
  secret:config.SECRET_KEY,
  resave:true,
  saveUninitialized:true}));
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req,res,next){
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  res.locals.util = util
  next();
});

app.use('/', require('./routes/home'));
app.use('/books', util.getPostQueryString, require('./routes/books'));
app.use('/posts', util.getPostQueryString, require('./routes/posts'));
app.use('/files', require('./routes/files'));
app.use('/users', require('./routes/users'));
app.use('/uploadcsv', require('./routes/uploadcsv'));
app.use('/imgs', require('./routes/imgs'));

var port = 3000;
app.listen(port, function(){
  console.log('server on! http://localhose:'+port);
})