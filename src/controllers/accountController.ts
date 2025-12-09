import * as accountModel from "../models/accountModel";
import { Request, Response, NextFunction } from "express";
import { Account, AccountWithInstitution } from "../types";
import { NotFoundError } from "../errors";

export const createAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { item_id, plaid_account_id, name, mask, balance } = req.body;

    const account: Account = await accountModel.insertAccount({
      item_id,
      plaid_account_id,
      name,
      mask,
      balance,
    });

    res.status(201).json({ account });
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
    const { account_id } = req.params;

    const account: AccountWithInstitution | null =
      await accountModel.getAccountById({
        account_id,
      });

    if (!account) {
      throw new NotFoundError("Account not found");
    }

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
    const { id: user_id } = req.user;

    const accounts: AccountWithInstitution[] =
      await accountModel.getUserAccounts(user_id);

    res.status(200).json({ accounts });
  } catch (err) {
    next(err);
  }
};

export const updateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { account_id } = req.params;
    const { name } = req.body;

    const account: Account = await accountModel.updateAccount({
      account_id,
      name,
    });
    res.status(200).json({ account });
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
    const { account_id } = req.params;

    await accountModel.deleteAccount({ account_id });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
