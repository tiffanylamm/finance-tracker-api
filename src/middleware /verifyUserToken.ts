import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader: string = req.headers["authorization"] ?? "";
  const token: string = authHeader.split(" ")[1];

  if (!token) {
    const error = new Error("No token provided");
    next(error);
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  try {
    const authData = jwt.verify(token, process.env.JWT_SECRET) as any;
    req.user = authData;
    return next();
  } catch (err) {
    next(err);
  }
};
