const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 从请求头获取 token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // 如果没有 token
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌，请先登录' });
    }
    
    try {
        // 验证 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 将用户信息附加到请求对象
        req.user = decoded;
        
        next(); // 继续执行后续中间件或路由处理
    } catch (err) {
        res.status(401).json({ message: '无效的令牌或令牌已过期' });
    }
};
