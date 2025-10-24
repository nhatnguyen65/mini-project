const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");
const {
    authMiddleware,
    adminMiddleware,
} = require("../middleware/authMiddleware");

/* ===== ADMIN ROUTES ===== */
// Lấy danh sách sản phẩm kèm stock kho
router.get("/all", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const products = await Product.find();
        const warehouse = await Warehouse.findOne({}).populate(
            "products.product"
        );

        const productsWithStock = products.map((p) => {
            const wProduct = warehouse?.products.find((wp) =>
                wp.product._id.equals(p._id)
            );
            return {
                ...p._doc,
                stock: wProduct?.stock || 0,
            };
        });

        res.json(productsWithStock);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy chi tiết sản phẩm kèm stock kho (admin)
router.get("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

        const warehouse = await Warehouse.findOne({}).populate(
            "products.product"
        );
        const wProduct = warehouse?.products.find((wp) =>
            wp.product._id.equals(product._id)
        );

        res.json({
            ...product._doc,
            stock: wProduct?.stock || 0,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// thêm sản phẩm
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // 1️⃣ Tạo sản phẩm mới
        const { stock = 0, ...productData } = req.body; // tách stock ra riêng
        const newProduct = new Product(productData);
        const savedProduct = await newProduct.save();

        // 2️⃣ Tìm warehouse hiện tại (nếu chưa có thì tạo mới)
        let warehouse = await Warehouse.findOne();
        if (!warehouse) {
            warehouse = new Warehouse({ products: [] });
        }

        // 3️⃣ Thêm sản phẩm vào danh sách trong warehouse
        warehouse.products.push({
            product: savedProduct._id,
            stock: Number(stock) || 0,
        });
        await warehouse.save();

        // 4️⃣ Trả về kết quả
        res.status(201).json({
            ...savedProduct._doc,
            stock: Number(stock) || 0,
        });
    } catch (err) {
        console.error("❌ Lỗi khi thêm sản phẩm:", err);
        res.status(500).json({ error: err.message });
    }
});
// Cập nhật sản phẩm (và tồn kho nếu có)
router.patch("/:id", async (req, res) => {
    try {
        const { stock, ...productData } = req.body; // tách riêng stock

        // --- Cập nhật thông tin sản phẩm ---
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: productData },
            { new: true, runValidators: true }
        );

        if (!updatedProduct)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy sản phẩm!" });

        // --- Nếu có field stock thì cập nhật luôn trong Warehouse ---
        if (typeof stock === "number") {
            const warehouse = await Warehouse.findOne(); // giả sử chỉ có 1 kho

            if (warehouse) {
                const existing = warehouse.products.find((p) =>
                    p.product.equals(req.params.id)
                );

                if (existing) {
                    existing.stock = stock; // gán số lượng mới
                } else {
                    warehouse.products.push({
                        product: req.params.id,
                        stock: stock,
                    });
                }

                await warehouse.save();
            }
        }

        res.json({
            success: true,
            message: "Cập nhật thành công!",
            product: updatedProduct,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật sản phẩm!",
        });
    }
});

//Xóa sản phẩm (Delete)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product)
            return res
                .status(404)
                .json({ error: "Không tìm thấy sản phẩm để xoá!" });

        // 🔹 Xoá luôn sản phẩm trong warehouse (nếu có)
        const warehouse = await Warehouse.findOne({});
        if (warehouse) {
            warehouse.products = warehouse.products.filter(
                (p) => !p.product.equals(req.params.id)
            );
            await warehouse.save();
        }

        res.json({ message: "Đã xoá sản phẩm thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ===== USER ROUTES ===== */
// Lấy danh sách sản phẩm
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy chi tiết sản phẩm theo ID
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
