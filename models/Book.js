//도서정보 DB
var mongoose = require('mongoose');

var bookSchema = mongoose.Schema({
  title     :{type:String, required:[true, '도서 제목을 입력하세요!']},
  author    :{type:String, required:[true, '저자를 입력하세요!']},
  publisher :{type:String, required:[true, '출판사를 입력하세요!']},
  year      :{type:String, required:[true, '출판연도를 입력하세요!']},
  kdc       :{type:String, required:[true, 'KDC를 입력하세요!']},
  isbn      :{type:String},
  type      :{type:String, required:[true, '분류를 입력하세요!']},
  cover     :{type:String, default:'/imgs/nocover'},
  intro     :{type:String},
  isParsed  :{type:Boolean, default:false}
}, {versionKey : false}); //versionKey 옵션은 _v 항목이 생기지 않도록 하는 역할

var Book = mongoose.model('book', bookSchema);
module.exports = Book;