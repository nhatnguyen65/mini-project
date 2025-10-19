const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart=require('../models/Cart');
const authMiddleware = require('../middleware/authMiddleware');

/// 🟢 Tạo đơn hàng từ giỏ hàng (chỉ user login)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const cart = await Cart.findOne({ user: userId }).populate('products.product');
        if (!cart || cart.products.length === 0)
            return res.status(400).json({ message: 'Giỏ hàng trống' });

        const { ngayDat, paymentMethod, paymentStatus, diaChiNhanHang } = req.body;
        const diaChiNhanHang2 = `${diaChiNhanHang.diaChiChiTiet}, ${diaChiNhanHang.phuongXa}, ${diaChiNhanHang.quanHuyen}, ${diaChiNhanHang.tinhThanh}`;

        let tongTienHang = 0;
        const orderProducts = cart.products.map(p => {
            const price = p.product?.promo?.name === "giareonline" ? p.product.promo.value : p.product.price;
            tongTienHang += Number(price) * p.soLuong;
            return {
                product: p.product._id,
                ten: p.product.name,
                gia: price,
                soLuong: p.soLuong
            };
        });

        const giamGia = 0;
        const phiVanChuyen = 30;
        const tongTienThanhToan = tongTienHang - giamGia + phiVanChuyen;

        const newOrder = new Order({
            user: userId,
            products: orderProducts,
            ngayDat,
            diaChiNhanHang: diaChiNhanHang2,
            tongTienHang,
            giamGia,
            tongTienThanhToan,
            paymentMethod,
            paymentStatus
        });

        await newOrder.save();

        // Xóa các sản phẩm đã đặt trong giỏ hàng
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

// 🟢 Lấy danh sách đơn hàng của user hiện tại
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const orders = await Order.find({ user: userId })
            .populate('user', 'username email')
            .populate('products.product', 'img name')
            .sort({ ngayDat: -1 });

        res.status(200).json(orders);
    } catch (err) {
        console.error('Lỗi lấy đơn hàng:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng' });
    }
});

// 🟢 Lấy chi tiết 1 đơn hàng (của user hiện tại)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const order = await Order.findOne({ _id: req.params.id, user: userId })
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
