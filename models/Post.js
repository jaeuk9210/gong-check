//글(리뷰) DB
var mongoose = require('mongoose');

var postSchema = mongoose.Schema({
  book      :{type:mongoose.Schema.Types.ObjectID, ref:'book', required:true},  //글(리뷰)가 올라간 도서 정보
  author    :{type:mongoose.Schema.Types.ObjectID, ref:'user', required:true},  //글(리뷰) 작성자 정보
  title     :{type:String, required:[true, '제목을 입력하세요!']},
  body      :{type:String, required:[true, '본문을 입력하세요!']},
  attachment:{type:mongoose.Schema.Types.ObjectID, ref:'file'},                 //첨부파일 정보
  likes     :[{type:mongoose.Schema.Types.ObjectID, ref:'user'}],
  createdAt :{type:Date, default:Date.now},
  updatedAt :{type:Date}
}, {versionKey : false});

var Post = mongoose.model('post', postSchema);
module.exports = Post;