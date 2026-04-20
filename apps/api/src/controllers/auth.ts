import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Joi from 'joi';

const signAccessToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });
};

const signRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
};

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  displayName: Joi.string().max(50).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: { code: 'USER_EXISTS', message: 'User already exists.' } });
    }

    const user = new User({ email, passwordHash: password, displayName });
    await user.save();

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Save refresh token hash
    const salt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, salt);
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, email: user.email, displayName: user.displayName },
        accessToken,
        refreshToken
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'REGISTRATION_FAILED', message: error.message } });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(429).json({ success: false, error: { code: 'ACCOUNT_LOCKED', message: 'Account locked. Try again later.' } });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        user.loginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockedUntil = undefined;

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    // Hash refresh token
    const salt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, salt);
    await user.save();

    res.json({
      success: true,
      data: {
        user: { id: user._id, email: user.email, displayName: user.displayName },
        accessToken,
        refreshToken
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'LOGIN_FAILED', message: error.message } });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ success: false, error: { code: 'REFRESH_REQUIRED', message: 'Refresh token required.' } });

  try {
    const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    const user = await User.findById(decoded.id);

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token.' } });
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      // Refresh token theft detected? Revoke all tokens.
      user.refreshTokenHash = undefined;
      await user.save();
      return res.status(401).json({ success: false, error: { code: 'TOKEN_THEFT_DETECTED', message: 'Refresh token reuse detected. Please login again.' } });
    }

    const newAccessToken = signAccessToken(user.id);
    const newRefreshToken = signRefreshToken(user.id);

    // Rotate refresh token
    const salt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, salt);
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token.' } });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
    res.json({ success: true, data: { message: 'Logged out successfully.' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'LOGOUT_FAILED', message: error.message } });
  }
};
