import * as transactionModel from "../models/transactionModel";
import { Request, Response, NextFunction } from "express";
export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id } = req.params;
    const transactions = await transactionModel.getUserTransactions({
      user_id,
    });
    res.status(200).json(transactions);
  } catch (err) {
    next(err);
  }
};
