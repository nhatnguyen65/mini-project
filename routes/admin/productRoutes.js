// const express = require("express");
// const router = express.Router();
// const Product = require("../../models/Product");
// const verifyAdmin = require("../../middleware/verifyAdmin");

// // 🧾 Lấy danh sách tất cả sản phẩm (admin có thể thấy cả sp ẩn hoặc hết hàng)
// router.get("/", verifyAdmin, async (req, res) => {
//     try {
//         const products = await Product.find();
//         res.json({
//             total: products.length,
//             data: products,
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// // ➕ Thêm sản phẩm mới
// router.post("/", verifyAdmin, async (req, res) => {
//     try {
//         const newProduct = new Product(req.body);
//         await newProduct.save();
//         res.status(201).json({
//             message: "Thêm sản phẩm thành công!",
//             product: newProduct,
//         });
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });

// // ✏️ Cập nhật sản phẩm theo ID
// router.put("/:id", verifyAdmin, async (req, res) => {
//     try {
//         const updatedProduct = await Product.findByIdAndUpdate(
//             req.params.id,
//             req.body,
//             { new: true }
//         );

//         if (!updatedProduct)
//             return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

//         res.json({
//             message: "Cập nhật sản phẩm thành công!",
//             product: updatedProduct,
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// // ❌ Xóa sản phẩm
// router.delete("/:id", verifyAdmin, async (req, res) => {
//     try {
//         const deletedProduct = await Product.findByIdAndDelete(req.params.id);
//         if (!deletedProduct)
//             return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

//         res.json({ message: "Xóa sản phẩm thành công!" });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// module.exports = router;
