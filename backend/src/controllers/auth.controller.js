const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'powervolt123';
const JWT_SECRET = process.env.JWT_SECRET || 'powervolt_secret_key';

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw ApiError.badRequest('Username and password are required');
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      throw new ApiError(401, 'Invalid username or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: ADMIN_USERNAME, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json(ApiResponse.success({ token, username: ADMIN_USERNAME }, 'Login successful'));
  } catch (error) {
    next(error);
  }
};

const verify = async (req, res, next) => {
  try {
    // If the request reached here, the auth middleware already verified the token
    res.json(ApiResponse.success({ username: req.user.username }, 'Token is valid'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  verify,
};
