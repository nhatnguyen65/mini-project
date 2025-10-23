const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { adminOnly } = require("../middleware/authMiddleware");

/// 🟢 Tạo đơn hàng từ giỏ hàng (chỉ user login)
router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const cart = await Cart.findOne({ user: userId }).populate(
            "products.product"
        );
        if (!cart || cart.products.length === 0)
            return res.status(400).json({ message: "Giỏ hàng trống" });

        const {
            products,
            ngayDat,
            paymentMethod,
            paymentStatus,
            diaChiNhanHang,
        } = req.body;
        const diaChiNhanHang2 = `${diaChiNhanHang.diaChiChiTiet}, ${diaChiNhanHang.phuongXa}, ${diaChiNhanHang.quanHuyen}, ${diaChiNhanHang.tinhThanh}`;

        let tongTienHang = 0;
        const orderProducts = products.map((p) => {
            const price =
                p.product?.promo?.name === "giareonline"
                    ? p.product.promo.value
                    : p.product.price;
            tongTienHang += Number(price) * p.soLuong;
            return {
                product: p.product._id,
                ten: p.product.name,
                gia: price,
                soLuong: p.soLuong,
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
            paymentStatus,
        });

        await newOrder.save();

        // Xóa các sản phẩm đã đặt trong giỏ hàng
        const orderedProductIds = products.map((p) => p.product);
        await Cart.updateOne(
            { user: userId },
            { $pull: { products: { product: { $in: orderedProductIds } } } }
        );

        res.json({
            success: true,
            message: "Đặt hàng thành công",
            order: newOrder,
        });
    } catch (err) {
        console.error("Lỗi khi tạo đơn hàng:", err);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: err.message,
        });
    }
});

// 🟢 Lấy danh sách đơn hàng của user hiện tại
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const orders = await Order.find({ user: userId })
            .populate("user", "username email")
            .populate("products.product", "img name company")
            .sort({ ngayDat: -1 });

        res.status(200).json(orders);
    } catch (err) {
        console.error("Lỗi lấy đơn hàng:", err);
        res.status(500).json({
            message: "Lỗi server khi lấy danh sách đơn hàng",
        });
    }
});

// 🟢 Lấy tất cả đơn hàng của tất cả users (chỉ admin)
router.get("/all", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate("user", "username email")
            .populate("products.product", "img name company")
            .sort({ ngayDat: -1 });

        res.status(200).json(orders);
    } catch (err) {
        console.error("Lỗi lấy tất cả đơn hàng:", err);
        res.status(500).json({
            message: "Lỗi server khi lấy danh sách tất cả đơn hàng",
        });
    }
});

// 🟢 Lấy chi tiết 1 đơn hàng (chỉ admin)
router.get("/all/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "username email")
            .populate("products.product", "name img price company");
        if (!order)
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        res.status(200).json(order);
    } catch (err) {
        console.error("Lỗi lấy chi tiết đơn hàng (admin):", err);
        res.status(500).json({
            message: "Lỗi server khi lấy chi tiết đơn hàng (admin)",
        });
    }
});

// 🟢 Cập nhật trạng thái đơn hàng (chỉ admin)
router.put(
    "/all/:id/status",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const { status } = req.body;

            const validStatuses = [
                "Chờ xử lý",
                "Đang giao",
                "Hoàn thành",
                "Đã hủy",
                "Hoàn trả",
            ];

            if (!validStatuses.includes(status)) {
                return res
                    .status(400)
                    .json({ message: "Trạng thái không hợp lệ" });
            }

            const order = await Order.findByIdAndUpdate(
                req.params.id,
                { orderStatus: status }, // ✅ Sửa ở đây
                { new: true }
            );

            if (!order) {
                return res
                    .status(404)
                    .json({ message: "Không tìm thấy đơn hàng" });
            }

            res.status(200).json({
                success: true,
                message: "Cập nhật trạng thái đơn hàng thành công",
                order,
            });
        } catch (err) {
            console.error("Lỗi cập nhật trạng thái đơn hàng:", err);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi cập nhật trạng thái đơn hàng",
            });
        }
    }
);

// 🟢 Lấy chi tiết 1 đơn hàng (của user hiện tại)
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.session.userId;
        const order = await Order.findOne({ _id: req.params.id, user: userId })
            .populate("user", "username email")
            .populate("products.product", "name img price company");

        if (!order)
            return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        res.status(200).json(order);
    } catch (err) {
        console.error("Lỗi lấy chi tiết đơn hàng:", err);
        res.status(500).json({
            message: "Lỗi server khi lấy chi tiết đơn hàng",
        });
    }
});

//Phần admin
/*Lấy danh sách tất cả đơn hàng
API: GET /api/orders/admin
Middleware: authMiddleware + adminOnly
Mục đích: Admin xem tất cả đơn, có thể lọc theo trạng thái, ngày đặt, hoặc user."""*/

router.get("/admin", authMiddleware, adminOnly, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "username email")
            .populate("products.product", "name img")
            .sort({ ngayDat: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Lấy chi tiết một đơn hàng bất kỳ

/*API: GET /api/orders/admin/:id
Middleware: authMiddleware + adminOnly
Mục đích: Xem chi tiết đơn, bao gồm sản phẩm, khách hàng, thanh toán, trạng thái.*/

router.get("/admin/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "username email")
            .populate("products.product", "name img price");
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Cập nhật trạng thái đơn hàng (admin)

/*API: PUT /api/orders/admin/:id
Middleware: authMiddleware + adminOnly
Mục đích: Admin cập nhật các field quản lý: orderStatus, paymentStatus, ngayGiao, note, history.*/

router.put("/admin/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
        const { orderStatus, paymentStatus, ngayGiao, note } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (orderStatus) {
            order.orderStatus = orderStatus;
            order.history.push({ status: orderStatus, note: note || "" });
        }
        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (ngayGiao) order.ngayGiao = new Date(ngayGiao);

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Hủy đơn hàng (cập nhật orderStatus: "Đã hủy")

/*API: PUT /api/orders/admin/:id/cancel
Middleware: authMiddleware + adminOnly
Mục đích: Hủy đơn, ghi vào lịch sử.*/

router.put("/admin/:id/cancel", authMiddleware, adminOnly, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.orderStatus = "Đã hủy";
        order.history.push({ status: "Đã hủy", note: "Hủy bởi admin" });

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;
