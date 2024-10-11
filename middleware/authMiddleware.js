import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Attach user info to request
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
};