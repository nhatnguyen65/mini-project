const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
// Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { ho, ten, email, username, password } = req.body;
        const exists = await User.findOne({ $or: [{ username }, { email }] });
        if (exists) return res.status(400).json({ success: false, error: 'Username hoặc email đã tồn tại' });

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ ho, ten, email, username, password: hashed });
        await user.save();

        // Lưu session ngay khi đăng ký
        req.session.userId = user._id;
        req.session.username = user.username;

        res.status(201).json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username }).populate('diaChi','-userId');
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, error: 'Sai mật khẩu' });

        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Đăng xuất
//Xóa session và cookie → user bị logout
router.post('/logout', authMiddleware, (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});
// Lấy thông tin user hiện tại
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-password').populate('diaChi','-userId');
        if (!user) return res.status(404).json({ success:false, error: 'User not found' });
        res.json({ success: true, user: { ...user.toObject(), password: undefined }});
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// update basic fields (ho, ten, email, username)
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { field, value } = req.body;
    const user = await User.findById(req.session.userId);

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Kiểm tra email trùng nếu đổi email
    if (field === 'email' && value !== user.email) {
      const emailExists = await User.findOne({ email: value });
      if (emailExists) return res.status(400).json({ success: false, error: 'Email đã tồn tại' });
    }

    user[field] = value;
    await user.save();

    res.json({ success: true, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// change password
// Đổi mật khẩu
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ success: false, error: 'Mật khẩu cũ không đúng' });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
module.exports = router;
