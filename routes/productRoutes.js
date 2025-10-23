const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/authMiddleware");

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

// thêm sản phẩm
router.post("/", authMiddleware, adminOnly, async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//Cập nhật sản phẩm (Update)
router.put("/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedProduct)
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Xóa sản phẩm (Delete)
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct)
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        res.json({ message: "Sản phẩm đã được xóa" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;
