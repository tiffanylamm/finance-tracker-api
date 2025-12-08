import { Request, Response, NextFunction } from "express";
import * as itemModel from "../models/itemModel";
import * as accountModel from "../models/accountModel";
import * as transactionModel from "../models/transactionModel";
import {
  Products,
  CountryCode,
  Configuration,
  PlaidEnvironments,
  PlaidApi,
  LinkTokenCreateRequest,
} from "plaid";
import { Item } from "../types";
import { Decimal } from "@prisma/client/runtime/client";
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

const PLAID_PRODUCTS = (process.env.PLAID_PRODUCTS || Products.Transactions)
  .split(",")
  .map((p) => p as Products);

const PLAID_COUNTRY_CODES = (process.env.PLAID_COUNTRY_CODES || "US")
  .split(",")
  .map((c) => c as CountryCode);

const PLAID_REDIRECT_URI = process.env.PLAID_REDIRECT_URI || "";
const SIGNAL_RULESET_KEY = process.env.SIGNAL_RULESET_KEY || "";

//initializing plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

const client = new PlaidApi(configuration);

export const createLinkToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const configs: LinkTokenCreateRequest = {
    user: {
      client_user_id: req.user.id,
    },
    client_name: "Finance Tracker",
    language: "en",
    country_codes: PLAID_COUNTRY_CODES,
    products: PLAID_PRODUCTS,
  };
  try {
    const createTokenResponse = await client.linkTokenCreate(configs);
    // console.log("createTokenResponse:", createTokenResponse.data);
    res.json(createTokenResponse.data);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const exchangePublicToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { public_token, metadata } = req.body;
  try {
    const exchangeRes = await client.itemPublicTokenExchange({
      public_token,
    });
    console.log("metadata", metadata);
    console.log("exchangeRes:", exchangeRes);
    const access_token: string = exchangeRes.data.access_token;
    const item_id: string = exchangeRes.data.item_id;
    // const itemInfo = await client.itemGet({ access_token });
    // console.log("itemInfo:", itemInfo.data);
    const institution_name: string = metadata.institution.name;
    const institution_id: string = metadata.institution.institution_id;

    const item: Item = await itemModel.insertItem({
      user_id: req.user.id,
      access_token,
      plaid_item_id: item_id,
      institution_name,
      institution_id,
    });

    await addAccountsFromItem({ item_id: item.id, access_token });

    res.json({ access_token });
  } catch (err) {
    next(err);
  }
};

const addAccountsFromItem = async ({
  item_id,
  access_token,
}: {
  item_id: string;
  access_token: string;
}) => {
  try {
    const itemAccountInfo = await client.accountsGet({ access_token });
    const accountIdMap = new Map<string, string>();
    console.log("itemAccountInfo:", itemAccountInfo.data.accounts);
    for (let account of itemAccountInfo.data.accounts) {
      let newAccount = await accountModel.insertAccount({
        item_id,
        plaid_account_id: account.account_id,
        name: account.name,
        mask: account.mask,
        balance: account.balances.available,
      });

      accountIdMap.set(newAccount.plaid_account_id, newAccount.id);
    }

    await addNewItemTransactions({ item_id, access_token, accountIdMap });
  } catch (err) {
    throw err;
  }
};

const addNewItemTransactions = async ({
  item_id,
  access_token,
  accountIdMap,
}: {
  item_id: string;
  access_token: string;
  accountIdMap: Map<string, string>;
}) => {
  try {
    const now = new Date().toISOString().split("T")[0];
    const past = new Date(Date.now() - 30 * 24 * 3600 * 1000)
      .toISOString()
      .split("T")[0];
    const result = await client.transactionsGet({
      access_token,
      start_date: past,
      end_date: now,
    });
    for (let transaction of result.data.transactions) {
      const account_id = accountIdMap.get(transaction.account_id);
      if (!account_id) {
        throw new Error("Account does not exist.");
      }

      const authorized_date = transaction.authorized_date
        ? new Date(transaction.authorized_date)
        : null;

      await transactionModel.insertTransaction({
        account_id: account_id,
        plaid_transaction_id: transaction.transaction_id,
        amount: new Decimal(transaction.amount),
        name: transaction.name,
        merchant_name: transaction.merchant_name ?? null,
        category: null,
        date: new Date(transaction.date),
        authorized_date,
        pending: transaction.pending,
        iso_currency_code: transaction.iso_currency_code,
      });
    }

    console.log("transactions:", result.data.transactions);
  } catch (err) {
    throw err;
  }
};

export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item_id: string = req.params.item_id;
    const item = await itemModel.getItem({ id: item_id });
    if (!item) {
      return next({ status: 404, message: "Plaid item not found" });
    }
    const access_token = item.access_token;
    const now = new Date().toISOString().split("T")[0];
    const past = new Date(Date.now() - 30 * 24 * 3600 * 1000)
      .toISOString()
      .split("T")[0];
    const result = await client.transactionsGet({
      access_token,
      start_date: past,
      end_date: now,
    });

    console.log("transactions:", result.data);
    res.json(result.data);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const removeItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const access_token: string = req.body.access_token;

  if (!access_token) {
    return res.status(400).json({ error: "Access token is required." });
  }

  try {
    await client.itemRemove({ access_token });
    res.status(200).json({
      success: true,
      message: `Financial institution connection removed.`,
    });
  } catch (err) {
    console.error(`Error removing plaid item.`);
    res.status(500).json({
      success: false,
      error: "Failed to remove Item connection.",
    });
  }
};
