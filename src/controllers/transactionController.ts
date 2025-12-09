import * as transactionModel from "../models/transactionModel";
import { Request, Response, NextFunction } from "express";
import { Transaction } from "../types";
import { NotFoundError } from "../errors";

export const getTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transaction_id } = req.params;

    const transaction = await transactionModel.getTransactionById({
      id: transaction_id,
    });

    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    return transaction;
  } catch (err) {
    next(err);
  }
};

export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: user_id } = req.user;
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
