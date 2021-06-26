//파일 저장 DB
var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');

// schema
var fileSchema = mongoose.Schema({
  originalFileName:{type:String},
  serverFileName:{type:String},
  size:{type:Number},
  uploadedBy:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},  //파일 업로더 정보
  postId:{type:mongoose.Schema.Types.ObjectId, ref:'post'},                     //파일이 등록된 게시글 정보
  isDeleted:{type:Boolean, default:false},
}, {versionKey : false});

fileSchema.methods.processDelete = function(){
  this.isDeleted = true;
  this.save();
};
fileSchema.methods.getFileStream = function(){
  var stream;
  var filePath = path.join(__dirname,'..','uploadedfiles',this.serverFileName);
  var fileExists = fs.existsSync(filePath);
  if(fileExists){
    stream = fs.createReadStream(filePath);
  }
  else {
    this.processDelete();
  }
  return stream;
};

var File = mongoose.model('file', fileSchema);

File.createNewInstance = async function(file, uploadedBy, postId){
  return await File.create({
      originalFileName:file.originalname,
      serverFileName:file.filename,
      size:file.size,
      uploadedBy:uploadedBy,
      postId:postId,
    });
};

module.exports = File;