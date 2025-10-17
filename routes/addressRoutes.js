const express=require('express');
const router=express.Router();
const Address=require('../models/Address');
const User=require('../models/User');

// Lấy địa chỉ mặc định của user
router.get('/:userId/default', async (req, res) => {
  try {
    const address = await Address.findOne({ userId: req.params.userId, macDinh: true });
    if (!address) return res.status(404).json({ message: 'Chưa có địa chỉ mặc định' });
    res.json(address);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh sách địa chỉ của user
router.get('/:userId', async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.params.userId });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Thêm địa chỉ của user
router.post('/:userId',async(req,res)=>{
    try{
    const {diaChiChiTiet,phuongXa,quanHuyen,tinhThanh}=req.body;
    const userId=req.params.userId;
    const newAdress=new Address({userId,diaChiChiTiet,phuongXa,quanHuyen,tinhThanh});
    await newAdress.save();
    const user=await User.findByIdAndUpdate(userId,{$push:{diaChi:newAdress._id}},{new:true}).populate('diaChi','-userId');
    res.status(201).json(user);
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

// ✅ 3. Cập nhật địa chỉ
router.put('/:addressId', async (req, res) => {
  try {
    const updated = await Address.findByIdAndUpdate(req.params.addressId, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    const userId=updated.userId;
    const user=await User.findById(userId).populate('diaChi','-userId');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ 4. Xóa địa chỉ
router.delete('/:addressId', async (req, res) => {
  try {
    const address = await Address.findByIdAndDelete(req.params.addressId);
    if (!address) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });

    // Gỡ địa chỉ khỏi user
    const user=await User.findByIdAndUpdate(address.userId, { $pull: { diaChi: address._id } },{new:true}).populate('diaChi','-userId');
    res.json({ message: 'Đã xóa địa chỉ thành công',user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
