const mongoose=require('mongoose');
const addressSchema = new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  diaChiChiTiet: { type: String, required: true },
  phuongXa:{type:String,required:true},
  quanHuyen: { type: String, required: true },
  tinhThanh:{type:String,required:true},
  macDinh: { type: Boolean, default: false } // địa chỉ mặc định
});
module.exports= mongoose.model('Address',addressSchema);