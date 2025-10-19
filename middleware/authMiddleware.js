function authMiddleware(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
    }
    next();
}
module.exports=authMiddleware;