const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");

// Hàm helper
const startOfDay = (d = new Date()) => new Date(d.setHours(0, 0, 0, 0));
const endOfDay = (d = new Date()) => new Date(d.setHours(23, 59, 59, 999));

// Dữ liệu xem nhanh
router.get("/", async (req, res) => {
    try {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        // ✅ Doanh thu hôm nay (đơn Hoàn thành)
        const revenueToday = await Order.aggregate([
            {
                $match: {
                    ngayDat: { $gte: todayStart, $lte: todayEnd },
                    orderStatus: "Hoàn thành",
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$tongTienThanhToan" },
                },
            },
        ]);

        // ✅ Tổng số đơn hôm nay
        const ordersToday = await Order.countDocuments({
            ngayDat: { $gte: todayStart, $lte: todayEnd },
        });

        // ✅ Đơn chờ xử lý
        const pendingOrders = await Order.countDocuments({
            orderStatus: "Chờ xử lý",
        });

        // ✅ Khách hàng mới hôm nay
        const newCustomers = await User.countDocuments({
            createdAt: { $gte: todayStart, $lte: todayEnd },
        });

        // ✅ Sản phẩm bán chạy nhất
        const bestSellerAgg = await Order.aggregate([
            { $match: { orderStatus: "Hoàn thành" } },
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.product",
                    totalSold: { $sum: "$products.soLuong" },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productInfo",
                },
            },
            { $unwind: "$productInfo" },
            {
                $project: {
                    _id: 0,
                    name: "$productInfo.name",
                },
            },
        ]);

        const bestSeller = bestSellerAgg[0]?.name || "Không có";

        // ✅ Tỷ lệ chuyển đổi (demo)
        const conversionRate = ((ordersToday / 1000) * 100).toFixed(2);

        res.json({
            revenueToday: revenueToday[0]?.total || 0,
            ordersToday,
            pendingOrders,
            newCustomers,
            bestSeller,
            conversionRate,
        });
    } catch (err) {
        console.error("Lỗi Dashboard:", err);
        res.status(500).json({ error: "Lỗi máy chủ!" });
    }
});

// Dữ liệu biểu đồ
router.get("/overview", async (req, res) => {
    try {
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - 6); // Lấy 7 ngày gần nhất (bao gồm hôm nay)
        startDate.setHours(0, 0, 0, 0);

        // ✅ Lấy các đơn hàng đã hoàn thành trong 7 ngày qua
        const revenueOrders = await Order.find({
            ngayDat: { $gte: startDate, $lte: now },
            orderStatus: "Hoàn thành",
        });

        // Xử lý dữ liệu cho Doanh Thu Tuần Này
        // ✅ Chuẩn bị map doanh thu cho từng ngày
        const revenueMap = new Map();
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            const label = day.toLocaleDateString("vi-VN", { weekday: "short" });
            revenueMap.set(label, 0);
        }

        // ✅ Cộng doanh thu cho từng ngày
        revenueOrders.forEach((order) => {
            const day = new Date(order.ngayDat);
            const label = day.toLocaleDateString("vi-VN", { weekday: "short" });

            const current = revenueMap.get(label) || 0;
            const amount = Number(order.tongTienThanhToan) || 0;

            revenueMap.set(label, current + amount);
        });

        // ✅ Chuyển Map sang mảng để trả về frontend
        const revenue = Array.from(revenueMap, ([label, value]) => ({
            label,
            value,
        }));

        // Xử lý dữ liệu cho Đơn Hàng Đã Xử Lý
        const ordersMap = new Map();
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            const label = day.toLocaleDateString("vi-VN", { weekday: "short" });
            ordersMap.set(label, { valueTotal: 0, valueProcessed: 0 });
        }

        // Lấy đơn trong 7 ngày gần nhất
        const orders = await Order.find({
            ngayDat: { $gte: startDate, $lte: now },
        });

        // Gom dữ liệu theo ngày
        for (const order of orders) {
            const label = order.ngayDat.toLocaleDateString("vi-VN", {
                weekday: "short",
            });
            const entry = ordersMap.get(label);
            if (!entry) continue; // tránh lỗi nếu có ngày lạ

            entry.valueTotal += 1;
            if (order.orderStatus !== "Chờ xử lý") {
                entry.valueProcessed += 1;
            }
        }

        // Trả về mảng kết quả
        const ordersData = Array.from(
            ordersMap,
            ([label, { valueTotal, valueProcessed }]) => ({
                label,
                valueTotal,
                valueProcessed,
            })
        );

        // Xử lý dữ liệu cho Các Thương Hiệu Bán Chạy Nhất
        const allOrders = await Order.find({
            orderStatus: "Hoàn thành",
        }).populate("products.product", "company");

        const brandMap = new Map();

        allOrders.forEach((order) => {
            order.products.forEach((p) => {
                const brand = p.product?.company || "Khác";
                if (!brandMap.has(brand)) {
                    brandMap.set(brand, 0);
                }
                // Cộng thêm theo số lượng sản phẩm bán ra
                brandMap.set(brand, brandMap.get(brand) + p.soLuong);
            });
        });

        // Chuyển sang mảng để gửi về frontend
        let brandsData = Array.from(brandMap, ([name, orders]) => ({
            name,
            orders,
        }));

        // Sắp xếp giảm dần theo số lượng bán
        brandsData.sort((a, b) => b.orders - a.orders);

        // ✅ Lấy top 4 thương hiệu, còn lại gộp vào "Khác"
        const topCount = 4;
        if (brandsData.length > topCount) {
            const topBrands = brandsData.slice(0, topCount);
            const otherTotal = brandsData
                .slice(topCount)
                .reduce((sum, item) => sum + item.orders, 0);
            topBrands.push({ name: "Khác", orders: otherTotal });
            brandsData = topBrands;
        }

        res.json({
            views: [],
            revenue,
            orders: ordersData,
            brands: brandsData,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Không lấy được dữ liệu overview!" });
    }
});

module.exports = router;
