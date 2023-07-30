const jwt = require("jsonwebtoken");

// verify token
const verifyToken = (req, res, next) => {
  const authToken = req.headers.authorization;

  if (authToken) {
    const token = authToken.split(" ")[1];
    try {
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decodedToken;
      next();
    } catch (err) {
      res.status(401).json({ message: "invalid token, access denied" });
    }
  } else {
    return res
      .status(401)
      .json({ message: "token is not provided, access denied" });
  }
};

// verify token & admin
const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      return res
        .status(401)
        .json({ message: "not allowed to access. only admins" });
    }
  });
};

// verify token & only user
const verifyTokenAndOnlyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id) {
      next();
    } else {
      return res
        .status(401)
        .json({ message: "not allowed to access. only user himself" });
    }
  });
};

// verify token & user & admin
const verifyTokenAndAuthrization = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.isAdmin) {
      next();
    } else {
      res
        .status(403)
        .json({ message: "not allowed, the user himself or admin" });
    }
  });
};

module.exports = {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndOnlyUser,
  verifyTokenAndAuthrization,
};
