function authMiddleware(req, res, next) {
    if (!req.session.userId) {
        return res
            .status(401)
            .json({ success: false, error: "Chưa đăng nhập" });
    }
    next();
}
// 🔹 Middleware chỉ cho admin
function adminOnly(req, res, next) {
    if (req.session.role !== "admin") {
        return res
            .status(403)
            .json({ success: false, error: "Không có quyền truy cập" });
    }
    next();
}
module.exports = authMiddleware;
module.exports.adminOnly = adminOnly;
