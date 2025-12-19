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
    const { id: userId } = req.user;
    const transactions = await transactionModel.getUserTransactions({
      user_id: userId,
    });
    res.status(200).json({ transactions });
  } catch (err) {
    next(err);
  }
};

export const getTransactionsWithCursor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const sortBy = (req.query.sortBy as string) || "date";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";
    const filters = req.query.filters
      ? JSON.parse(req.query.filters as string)
      : undefined;

    let prismaFilters: any = {};

    //map frontend field names to database field names
    const sortFieldMap: Record<string, any> = {
      date: { date: sortOrder },
      amount: { amount: sortOrder },
      name: { name: sortOrder },
      merchant_name: { merchant_name: sortOrder },
      account_name: { account: { name: sortOrder } },
      pending: { pending: sortOrder },
    };

    const orderBy = sortFieldMap[sortBy] || { date: "desc" };

    //fetch transactions with cursor pagination
    const transactions = await transactionModel.getUserTransactionsWithCursor({
      user_id: userId,
      limit,
      cursor,
      orderBy,
      filters,
    });

    const hasMore = transactions.length > limit;
    const items = hasMore ? transactions.slice(0, -1) : transactions;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.status(200).json({
      transactions: items,
      nextCursor,
      hasMore,
    });
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
