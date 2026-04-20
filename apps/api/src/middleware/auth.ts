import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Joi from 'joi';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication token required.' } });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired access token.' } });
  }
};

export const validateBody = (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.details[0].message } });
  }
  next();
};
