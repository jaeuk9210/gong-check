//파일 저장 DB
var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');

// schema
var csvSchema = mongoose.Schema({
  originalFileName:{type:String},
  serverFileName:{type:String},
  size:{type:Number},
}, {versionKey : false});

csvSchema.methods.processDelete = function(){
  this.isDeleted = true;
  this.save();
};
csvSchema.methods.getcsvStream = function(){
  var stream;
  var csvPath = path.join(__dirname,'..','uploadedcsvs',this.serverFileName);
  var csvExists = fs.existsSync(csvPath);
  if(csvExists){
    stream = fs.createReadStream(csvPath);
  }
  else {
    this.processDelete();
  }
  return stream;
};

var CSV = mongoose.model('csv', csvSchema);

CSV.createNewInstance = async function(csv, uploadedBy, postId){
  return await CSV.create({
      originalFileName:csv.originalname,
      serverFileName:csv.filename,
      size:csv.size,
    });
};

module.exports = CSV;