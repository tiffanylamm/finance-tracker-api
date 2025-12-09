import { Request, Response, NextFunction } from "express";
import * as transactionModel from "../models/transactionModel";
import { ForbiddenError } from "../errors";

export const authorizeTransactionAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transaction_id } = req.params;
    const { id: user_id } = req.user;

    const belongsToUser = await transactionModel.checkTransactionOwnership({
      transaction_id,
      user_id,
    });

    if (!belongsToUser) {
      if (!belongsToUser) {
        throw new ForbiddenError("You don't have access to transaction");
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};
