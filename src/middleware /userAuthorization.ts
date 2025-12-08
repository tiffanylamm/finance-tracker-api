import { Request, Response, NextFunction } from "express";

export const authorizeUserAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id } = req.params;
    const { id } = req.user;

    const belongsToUser = id === user_id;

    if (!belongsToUser) {
      return res
        .status(403)
        .json({ error: "Forbidden: You don't have access to this user" });
    }

    next();
  } catch (err) {
    next(err);
  }
};
