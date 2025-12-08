import { Request, Response, NextFunction } from "express";
import * as transactionModel from "../models/transactionModel";

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
      return res
        .status(403)
        .json({
          error: "Forbidden: You don't have access to this transaction",
        });
    }

    next();
  } catch (err) {
    next(err);
  }
};
