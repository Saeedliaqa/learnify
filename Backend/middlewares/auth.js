const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  // Support both lowercase and uppercase headers
  const rawHeader = req.headers.authorization || req.header("Authorization");
  const token = rawHeader?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access Denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired token." });
  }
};

module.exports = authenticate;
