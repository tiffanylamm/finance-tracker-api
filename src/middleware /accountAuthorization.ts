import { Request, Response, NextFunction } from "express";
import * as accountModel from "../models/accountModel";

export const authorizeAccountAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { account_id } = req.params;
    const { id: user_id } = req.user;

    const belongsToUser = await accountModel.checkAccountOwnership({
      account_id,
      user_id,
    });

    if (!belongsToUser) {
      return res
        .status(403)
        .json({ error: "Forbidden: You don't have access to this account" });
    }

    next();
  } catch (err) {
    next(err);
  }
};
