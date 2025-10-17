const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { ho, ten, email, username, password } = req.body;

        // Check trùng username
        const exists = await User.findOne({ username });
        if (exists) return res.status(400).json({ success: false, error: 'Username đã tồn tại' });
        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ ho, ten, email, username, password: hashed});
        await user.save();
        res.status(201).json({ success: true, user });
    } catch (err) {
        console.error(err);
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

        res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});
// get user by id (exclude password)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('diaChi','-userId');
    if (!user) return res.status(404).json({ success:false, error: 'User not found' });
    res.json({ success:true, user });
  } catch (err) { res.status(500).json({ success:false, error: err.message }); }
});
// update basic fields (ho, ten, email, username)
router.put('/:id', async (req, res) => {
  try {
    const { ho, ten, email, username } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.json({ success:false, error: 'User not found' });
    // check username conflict
    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) return res.json({ success:false, error: 'Username đã tồn tại' });
    }
    user.ho = ho ?? user.ho;
    user.ten = ten ?? user.ten;
    user.email = email ?? user.email;
    user.username = username ?? user.username;
    await user.save();
    const u = user.toObject(); delete u.password;
    res.json({ success:true, user: u });
  } catch (err) { res.json({ success:false, error: err.message }); }
});

// change password
router.put('/:id/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.json({ success:false, error: 'User not found' });
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.json({ success:false, error: 'Mật khẩu cũ không đúng' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success:true });
  } catch (err) { res.json({ success:false, error: err.message }); }
});
module.exports = router;
