const jwt = require('jsonwebtoken');
const router = require('express').Router();
// Middleware for token verification
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Protect this route with JWT middleware
router.get('/api/protected-route', authenticateJWT, (req, res) => {
  res.json({ message: 'This is a protected route' });
});

module.exports = router;