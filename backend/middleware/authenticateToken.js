const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; // Extract the token from the cookies
    if (!token) return res.status(401).json({ error: 'Authentication required' });
  
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      req.user = user; // Attach user info to the request object
      next();
    });
  };
  
  export default authenticateToken;
  