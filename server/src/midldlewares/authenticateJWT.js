const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const authenticateJWT = (req, res, next) => {
  const tokenString = req.cookies.token;
  console.log(tokenString,"authJWT  ");
  if (tokenString) {
    try {
      console.log("JWT_SECRET:", process.env.JWT_SECRET);
      const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ error: "Invalid token" });
    }
  } else {
    return res.status(401).json({ error: "Authorization header missing" });
  }
};

module.exports = authenticateJWT;
