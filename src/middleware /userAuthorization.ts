import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors";

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
      throw new ForbiddenError("You don't have access to this user");
    }

    next();
  } catch (err) {
    next(err);
  }
};
