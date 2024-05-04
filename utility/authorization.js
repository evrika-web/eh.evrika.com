const jwt = require('jsonwebtoken');

// Middleware to verify the token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN_VALUE

  if (token == null) {
    return res.status(401).send({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send({ error: 'Token is not valid' });
    }
    req.user = user;
    next();
  });
}

// Middleware to check if the user is authorized to delete resources
function checkAuthorization(req, res, next) {
  // Check if the user has the 'Admin' role
  if (req.user.role !== 'admin') {
    return res.status(403).send({ error: 'Unauthorized' });
  }
  next();
}
module.exports={
    authenticateToken,
    checkAuthorization
}