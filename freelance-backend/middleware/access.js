const jwt = require('jsonwebtoken');

const verifyLifetimeAccess = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Gets token from "Bearer TOKEN"

  if (!token) return res.status(403).json({ message: "No token, access denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { verifyLifetimeAccess };