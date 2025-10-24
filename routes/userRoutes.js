const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { authMiddleware, adminMiddleware } = require("../middleware/authMiddleware");

//Các thao tác của user
// Đăng ký
router.post("/register", async (req, res) => {
    try {
        const { ho, ten, email, username, password } = req.body;

        // Tìm user trùng username hoặc email
        const existingUser = await User.findOne({
            $or: [{ username }, { email }],
        });

        if (existingUser) {
            const usernameTaken = existingUser.username === username;
            const emailTaken = existingUser.email === email;

            let errorMessage = "";
            if (usernameTaken && emailTaken)
                errorMessage = "Cả username và email đều đã tồn tại.";
            else if (usernameTaken)
                errorMessage = "Username đã tồn tại. Vui lòng chọn tên khác.";
            else if (emailTaken)
                errorMessage = "Email này đã được đăng ký. Vui lòng dùng email khác.";

            return res.status(400).json({
                success: false,
                error: errorMessage,
            });
        }

        // Hash mật khẩu
        const hashed = await bcrypt.hash(password, 10);

        // Tạo user mới
        const user = new User({
            ho,
            ten,
            email,
            username,
            password: hashed,
        });
        await user.save();

        // Lưu session ngay khi đăng ký
        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;

        res.status(201).json({ success: true, user });
    } catch (err) {
        // Bắt lỗi validate mongoose (nếu có)
        if (err.name === "ValidationError") {
            const message = Object.values(err.errors)
                .map((e) => e.message)
                .join(", ");
            return res.status(400).json({ success: false, error: message });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

// Đăng nhập
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username }).populate(
            "diaChi",
            "-userId"
        );
        if (!user)
            return res
                .status(404)
                .json({ success: false, error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res
                .status(400)
                .json({ success: false, error: "Sai mật khẩu" });

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Đăng xuất
//Xóa session và cookie → user bị logout
router.post("/logout", authMiddleware, (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.clearCookie("connect.sid");
        res.json({ success: true });
    });
});
// Lấy thông tin bản thân
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId)
            .select("-password")
            .populate("diaChi", "-userId");
        if (!user)
            return res
                .status(404)
                .json({ success: false, error: "User not found" });
        res.json({ success: true, user: { ...user.toObject() } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Cập nhật thông tin cá nhân (ho, ten, email)
router.put("/update", authMiddleware, async (req, res) => {
    try {
        const { field, value } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user)
            return res
                .status(404)
                .json({ success: false, error: "User not found" });

        // Kiểm tra email trùng nếu đổi email
        if (field === "email" && value !== user.email) {
            const emailExists = await User.findOne({ email: value });
            if (emailExists)
                return res
                    .status(400)
                    .json({ success: false, error: "Email đã tồn tại" });
        }

        user[field] = value;
        await user.save();

        res.json({
            success: true,
            user: { ...user.toObject(), password: undefined },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// change password
// Đổi mật khẩu
router.put("/change-password", authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user)
            return res
                .status(404)
                .json({ success: false, error: "User not found" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch)
            return res
                .status(400)
                .json({ success: false, error: "Mật khẩu cũ không đúng" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//Các thao tác của admin
//admin lấy toàn bộ thông tin người dùng
router.get("/", authMiddleware,adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select("-password").populate("diaChi", "-userId");
        res.json(users);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Xem chi tiết 1 user
router.get("/:id", authMiddleware,adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password").populate("diaChi", "-userId");;
        if (!user)
            return res
                .status(404)
                .json({ success: false, error: "User not found" });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Tạo user mới (admin tạo)
router.post("/", authMiddleware,adminMiddleware, async (req, res) => {
    try {
        const { ho, ten, email, username, password, role } = req.body;
        const exists = await User.findOne({ $or: [{ username }, { email }] });
        if (exists)
            return res.status(400).json({
                success: false,
                error: "Username hoặc email đã tồn tại",
            });

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({
            ho,
            ten,
            email,
            username,
            password: hashed,
            role,
        });
        await user.save();
        res.status(201).json({
            success: true,
            user: { ...user.toObject(), password: undefined },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Cập nhật user bất kỳ
router.put("/:id", authMiddleware,adminMiddleware, async (req, res) => {
    try {
        // Không cho admin update password trực tiếp
        const { password, ...updateFields } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true } // trả về document đã update
        );

        if (!updatedUser)
            return res
                .status(404)
                .json({ success: false, error: "User not found" });

        res.json({
            success: true,
            user: { ...updatedUser.toObject(), password: undefined },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Xóa user
router.delete("/:id", authMiddleware,adminMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "User đã bị xóa" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Thay đổi role
router.put("/:id/role", authMiddleware,adminMiddleware, async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);
        if (!user)
            return res
                .status(404)
                .json({ success: false, error: "User not found" });

        user.role = role;
        await user.save();
        res.json({
            success: true,
            user: { ...user.toObject(), password: undefined },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
module.exports = router;
