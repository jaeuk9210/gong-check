var util = {};

util.parseError = function(errors){
  var parsed = {};
  if(errors.name == 'ValidationError'){
    for(var name in errors.errors){
      var validationError = errors.errors[name];
      parsed[name] = { message:validationError.message };
    }
  }
  else if(errors.code == '11000' && errors.errmsg.indexOf('username') > 0) {
    parsed.username = { message:'This username already exists!' };
  }
  else {
    parsed.unhandled = JSON.stringify(errors);
  }
  return parsed;
}

util.isLoggedin = function(req, res, next) {
  if(req.isAuthenticated()) {
    next();
  } else {
    req.flash('errors', {login:"로그인이 필요합니다."});
    res.redirect('/login');
  }
}

util.noPermission = function(req, res) {
  req.flash('errors', {login: "권한이 없습니다."});
  req.logout();
  res.redirect('/login');
}

util.bytesToSize = function(bytes) { // 1
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

util.removeHTML = function(text) {
  text = text.replace(/<br\/>/ig, "\n");
  text = text.replace(/<(\/)?([a-zA-Z]*)(\s[a-zA-Z]*=[^>]*)?(\s)*(\/)?>/ig, "");
  return text;
}

util.replaceAll = function(str, searchStr, replaceStr) {
  return str.split(searchStr).join(replaceStr);
}

util.getPostQueryString = function(req, res, next){
  res.locals.getPostQueryString = function(isAppended=false, overwrites={}){    
    var queryString = '';
    var queryArray = [];
    var page = overwrites.page?overwrites.page:(req.query.page?req.query.page:'');
    var limit = overwrites.limit?overwrites.limit:(req.query.limit?req.query.limit:'');
    var searchType = overwrites.searchType?overwrites.searchType:(req.query.searchType?req.query.searchType:''); // 1
    var searchText = overwrites.searchText?overwrites.searchText:(req.query.searchText?req.query.searchText:''); // 1
    var kdc = overwrites.kdc?overwrites.kdc:(req.query.kdc?req.query.kdc:'');

    if(page) queryArray.push('page='+page);
    if(limit) queryArray.push('limit='+limit);
    if(searchType) queryArray.push('searchType='+searchType);
    if(searchText) queryArray.push('searchText='+searchText);
    if(kdc) queryArray.push('kdc='+kdc);

    if(queryArray.length>0) queryString = (isAppended?'&':'?') + queryArray.join('&');
    //console.log(queryString)
    return queryString;
  }
  next();
}

module.exports = util;