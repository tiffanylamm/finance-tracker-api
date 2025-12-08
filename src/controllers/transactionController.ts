import * as transactionModel from "../models/transactionModel";
import { Request, Response, NextFunction } from "express";
import { Transaction } from "../types";
export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id: string = req.user.id;
    const transactions = await transactionModel.getUserTransactions({
      user_id,
    });
    res.status(200).json({ transactions });
  } catch (err) {
    next(err);
  }
};

//update
export const updateTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: user_id } = req.user;
    const { data } = req.body;

    const transaction: Transaction = await transactionModel.updateTransaction({
      id: user_id,
      data,
    });
    
    return res.status(200).json({ transaction });
  } catch (err) {
    next(err);
  }
};
