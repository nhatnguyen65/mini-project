const User = require("../models/User"); // nhớ import User nếu chưa có

const adminMiddleware = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({
                message:
                    "Quyền truy cập bị từ chối. Chỉ admin mới có thể truy cập.",
            });
        }
        next();
    } catch (err) {
        console.error("Lỗi kiểm tra quyền admin:", err);
        res.status(500).json({
            message: "Lỗi server khi kiểm tra quyền admin",
        });
    }
};

module.exports = adminMiddleware;
