const Cart = require('../models/Cart');
const Product = require('../models/Product');
const express = require('express');
const router = express.Router();
router.post('/add',async (req, res) => {
  try {
    const { userId, productId, ten, gia, soLuong } = req.body;

    // Kiểm tra xem user đã có giỏ hàng chưa
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // ❌ Nếu chưa có giỏ hàng => tạo mới
      cart = new Cart({
        user: userId,
        products: [{ product: productId, ten, gia, soLuong }]
      });
    } else {
      // ✅ Nếu đã có giỏ hàng => kiểm tra sản phẩm có sẵn chưa
      const index = cart.products.findIndex(
        p => p.product.toString() === productId
      );

      if (index >= 0) {
        // Nếu có => tăng số lượng
        cart.products[index].soLuong += soLuong;
      } else {
        // Nếu chưa => thêm mới vào giỏ
        cart.products.push({ product: productId,soLuong });
      }

      cart.updatedAt = new Date();
    }

    // Lưu lại vào MongoDB
    await cart.save();

    res.status(200).json({success:true, message: 'Đã cập nhật giỏ hàng thành công', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false,message: 'Lỗi khi cập nhật giỏ hàng' });
  }
});
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId; // lấy đúng id
        if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });

        const cart = await Cart.findOne({ user: userId })
                               .populate('products.product', 'name price img promo'); // .exec() optional với await

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng' });
        }

        res.json({ success: true, cart });
    } catch (err) {
        console.error('Lỗi khi lấy giỏ hàng', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});
// PUT /api/cart?userId=xxx
/*{
    "products": [
        { "product": "64f0abcd1234567890abcd01", "soLuong": 2 },
        { "product": "64f0abcd1234567890abcd02", "soLuong": 1 }
    ]
}*/

router.put('/', async (req, res) => {
    try {
        const userId = req.query.userId;
        const { products } = req.body;

        if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });

        const cart = await Cart.findOne({ user: userId });
        if (!cart) return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng' });

        for (let p of products) {
            const item = cart.products.find(i => i.product.toString() === p.product);
            if (item) item.soLuong = p.soLuong;
        }

        await cart.save();
        res.json({ success: true, cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});
// DELETE /api/cart?userId=xxx&productId=yyy
router.delete('/', async (req, res) => {
    try {
        const { userId, productId } = req.query;
        if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });

        const cart = await Cart.findOne({ user: userId });
        if (!cart) return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng' });

        if (productId) {
            // Xóa 1 sản phẩm
            cart.products = cart.products.filter(p => p.product.toString() !== productId);
            await cart.save();
            return res.json({ success: true, message: 'Xóa sản phẩm thành công', cart });
        }

        // Nếu không có productId → xóa hết giỏ hàng
        cart.products = [];
        await cart.save();
        res.json({ success: true, message: 'Xóa toàn bộ giỏ hàng', cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;