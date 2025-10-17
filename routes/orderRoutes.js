const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart=require('../models/Cart');
// Tạo đơn hàng từ giỏ
router.post('/:userId', async (req, res) => {
    try {
      
        const userId  = req.params.userId;
        const user = await User.findById(userId);
        if(!user) return res.status(404).json({ error: 'User not found' });
        cart=await Cart.findOne({user:userId}).populate('products.product');

        if(!cart || cart.products.length===0)
          return res.status(400).json({message:'Giỏ hàng trống'});

        const data=req.body;
        const {products,ngayDat,paymentMethod,paymentStatus,diaChiNhanHang}=data
        const diaChiNhanHang2=`${diaChiNhanHang.diaChiChiTiet}, ${diaChiNhanHang.phuongXa}, ${diaChiNhanHang.quanHuyen}, ${diaChiNhanHang.tinhThanh}`;
        let tongTienHang = 0;
        const orderProducts= products.map(p => {
         price=p.product?.promo?.name=="giareonline"?p.product.promo.value:p.product.price;
            tongTienHang += Number(price) * p.soLuong;
            return {
            product: p.product._id,
            ten: p.product.name,    // 🆕 thêm tên tại thời điểm đặt hàng
            gia: price,          // 🆕 giá tại thời điểm đặt hàng
            soLuong: p.soLuong
      };
        });
        const giamGia = 0;
        const phiVanChuyen = 30; // thêm sau nếu có
        const tongTienThanhToan = tongTienHang - giamGia + phiVanChuyen;; // sau này có thể cộng phí ship
        const newOrder = new Order({
               user: userId,
               products: orderProducts,
               ngayDat,
               diaChiNhanHang:diaChiNhanHang2,
               tongTienHang,
               giamGia,
               tongTienThanhToan,
               paymentMethod,
               paymentStatus
    });

        await newOrder.save();

    // Xoá các sản phẩm đã đặt trong giỏ hàng
    const orderedProductIds = orderProducts.map(p => p.product);
    await Cart.updateOne(
      { user: userId },
      { $pull: { products: { product: { $in: orderedProductIds } } } }
    );
 res.json({ success: true, message: 'Đặt hàng thành công', order: newOrder });
  } catch (err) {
    console.error('Lỗi khi tạo đơn hàng:', err);
    res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
  }
});


// 🟢 [GET] /api/orders?userId=... → Lấy danh sách đơn hàng của 1 user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};
    if (userId) query.user = userId; // nếu có userId thì lọc đơn hàng của user đó
    const orders = await Order.find(query)
      .populate('user', 'username email')       // hiển thị thông tin cơ bản của user
      .populate('products.product', 'img') // hiển thị thông tin sản phẩm
      .sort({ ngayDat: -1 });                   // sắp xếp mới nhất lên đầu
    res.status(200).json(orders);
  } catch (err) {
    console.error('Lỗi lấy đơn hàng:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng' });
  }
});

// 🟢 [GET] /api/orders/:id → Lấy chi tiết 1 đơn hàng
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email')
      .populate('products.product', 'name img price');

    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    res.status(200).json(order);
  } catch (err) {
    console.error('Lỗi lấy chi tiết đơn hàng:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết đơn hàng' });
  }
});

module.exports = router;
