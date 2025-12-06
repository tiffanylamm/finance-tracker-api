import * as accountModel from "../models/accountModel";
import { Request, Response, NextFunction } from "express";
import { Account } from "../types";

export const createAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      item_id,
      plaid_account_id,
      name,
    }: { item_id: string; plaid_account_id: string; name: string } = req.body;

    const account: Account = await accountModel.insertAccount({
      item_id,
      plaid_account_id,
      name,
    });

    res.status(201).json({ message: "Account successfully created.", account });
  } catch (err) {
    next(err);
  }
};

export const getAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const account_id: string = req.params.account_id;

    const account: Account = await accountModel.getAccountById({ account_id });

    res.status(200).json({ account });
  } catch (err) {
    next(err);
  }
};

export const getUserAccounts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id: string = req.user.id;
    const accounts: Account[] = await accountModel.getUserAccounts(user_id);
    res.status(200).json({ accounts });
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const account_id: string = req.params.account_id;

    await accountModel.deleteAccount({ account_id });

    res.status(200).json({ message: "Account successfully deleted." });
  } catch (err) {
    next(err);
  }
};
