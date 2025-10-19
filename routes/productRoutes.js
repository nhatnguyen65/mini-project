const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

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

// Cập nhật sản phẩm theo ID
router.put("/:id", async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // trả về bản ghi sau khi cập nhật
        );

        if (!updatedProduct)
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

        res.json({
            message: "Cập nhật sản phẩm thành công!",
            product: updatedProduct,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
