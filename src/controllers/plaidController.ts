import { Request, Response, NextFunction, response } from "express";
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
import { BadRequestError, NotFoundError } from "../errors";

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

export const client = new PlaidApi(configuration);

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
    res.status(200).json(createTokenResponse.data);
  } catch (err) {
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

    const { access_token, item_id } = exchangeRes.data;
    const { name, institution_id } = metadata.institution;
    // console.log("metadata", metadata);
    // console.log("exchangeRes:", exchangeRes);
    // const itemInfo = await client.itemGet({ access_token });
    // console.log("itemInfo:", itemInfo.data);

    const item: Item = await itemModel.insertItem({
      user_id: req.user.id,
      access_token,
      plaid_item_id: item_id,
      institution_name: name,
      institution_id,
    });

    await addAccountsFromItem({ item_id: item.id, access_token });

    res.status(200).json({ access_token });
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
    // console.log("itemAccountInfo:", itemAccountInfo.data.accounts);
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

    await initialTransactionSync({ item_id, access_token, accountIdMap });
  } catch (err) {
    throw err;
  }
};

const initialTransactionSync = async ({
  item_id,
  access_token,
  accountIdMap,
}: {
  item_id: string;
  access_token: string;
  accountIdMap: Map<string, string>;
}) => {
  try {
    let cursor: string | undefined = undefined;
    let hasMore = true;
    let addedCount = 0;

    //sync until all available transactions synced
    while (hasMore) {
      const request: any = { access_token };

      if (cursor) {
        request.cursor = cursor;
      }

      const res = await client.transactionsSync(request);
      const data = res.data;

      for (let transaction of data.added) {
        const account_id = accountIdMap.get(transaction.account_id);
        if (!account_id) {
          console.warn(
            `Account not found for transaction: ${transaction.transaction_id}`
          );
          continue;
        }

        const authorized_date = transaction.authorized_date
          ? new Date(transaction.authorized_date)
          : null;

        await transactionModel.insertTransaction({
          account_id,
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
        addedCount++;
      }

      //update cursor + check if more data
      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    //store final cursor for future syncs
    await itemModel.updateItem({
      item_id,
      data: { transaction_cursor: cursor },
    });

    console.log(
      `Initial sync completed: ${addedCount} transactions added for item ${item_id}`
    );
  } catch (err) {
    throw err;
  }
};

export const syncTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { item_id } = req.params;
    const item = await itemModel.getItem({ id: item_id });

    if (!item) {
      throw new NotFoundError("Plaid item not found");
    }

    const { access_token, transaction_cursor } = item;

    ////START HERE MAKE MAPPING OF PLAID_ACCOUNT_ID TO OUR ACCOUNT_ID
    const accounts = await accountModel.getAccountsByItemId(item_id);
    const accountIdMap = new Map<string, string>();
    accounts.forEach((account) => {
      accountIdMap.set(account.plaid_account_id, account.id);
    });

    let cursor = transaction_cursor || undefined;
    let hasMore = true;
    let added = 0;
    let modified = 0;
    let removed = 0;

    while (hasMore) {
      const request: any = {
        access_token,
      };

      if (cursor) {
        request.cursor = cursor;
      }

      const response = await client.transactionsSync(request);
      const data = response.data;

      //process added transactions
      for (let transaction of data.added) {
        const account_id = accountIdMap.get(transaction.account_id);
        if (!account_id) {
          console.warn(
            `Account not found for transaction: ${transaction.transaction_id}`
          );
          continue;
        }

        const authorized_date = transaction.authorized_date
          ? new Date(transaction.authorized_date)
          : null;

        try {
          await transactionModel.insertTransaction({
            account_id,
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
          added++;
        } catch (err) {
          console.error(
            `Error inserting transaction ${transaction.transaction_id}:`,
            err
          );
        }
      }

      //process modified transactions
      for (let transaction of data.modified) {
        const account_id = accountIdMap.get(transaction.account_id);
        if (!account_id) {
          console.warn(
            `Account not found for transaction: ${transaction.transaction_id}`
          );
          continue;
        }

        const authorized_date = transaction.authorized_date
          ? new Date(transaction.authorized_date)
          : null;

        try {
          await transactionModel.updateTransaction({
            id: transaction.transaction_id,
            data: {
              account_id,
              amount: new Decimal(transaction.amount),
              name: transaction.name,
              merchant_name: transaction.merchant_name ?? null,
              date: new Date(transaction.date),
              authorized_date,
              pending: transaction.pending,
              iso_currency_code: transaction.iso_currency_code,
            },
          });
          modified++;
        } catch (err) {
          console.error(
            `Error updating transaction ${transaction.transaction_id}:`,
            err
          );
        }
      }

      //process removed transactions
      for (let transaction of data.removed) {
        try {
          await transactionModel.deleteTransactionByPlaidId(
            transaction.transaction_id
          );
          removed++;
        } catch (err) {
          console.error(
            `Error removing transaction ${transaction.transaction_id}:`,
            err
          );
        }
      }

      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    //store latest cursor
    await itemModel.updateItem({
      item_id,
      data: { transaction_cursor: cursor },
    });

    res.status(200).json({
      added,
      modified,
      removed,
      message: `Sync completed: ${added} added, ${modified} modified, ${removed} removed`,
    });
  } catch (err) {
    next(err);
  }
};

export const syncAllUserTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const items = await itemModel.getItems({ user_id: userId });

    const results = [];

    for (let item of items) {
      try {
        const { access_token, transaction_cursor } = item;

        const accounts = await accountModel.getAccountsByItemId(item.id);
        const accountIdMap = new Map<string, string>();
        accounts.forEach((account) => {
          accountIdMap.set(account.plaid_account_id, account.id);
        });

        let cursor = transaction_cursor || undefined;
        let hasMore = true;
        let added = 0;
        let modified = 0;
        let removed = 0;

        while (hasMore) {
          const request: any = { access_token };
          if (cursor) request.cursor = cursor;

          const response = await client.transactionsSync(request);
          const data = response.data;

          // Process transactions (same logic as syncTransactions)
          for (let transaction of data.added) {
            const account_id = accountIdMap.get(transaction.account_id);
            if (!account_id) continue;

            const authorized_date = transaction.authorized_date
              ? new Date(transaction.authorized_date)
              : null;

            try {
              await transactionModel.insertTransaction({
                account_id,
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
              added++;
            } catch (err) {
              console.error(`Error inserting transaction:`, err);
            }
          }

          for (let transaction of data.modified) {
            const account_id = accountIdMap.get(transaction.account_id);
            if (!account_id) continue;

            const authorized_date = transaction.authorized_date
              ? new Date(transaction.authorized_date)
              : null;

            try {
              await transactionModel.updateTransaction({
                id: transaction.transaction_id,
                data: {
                  account_id,
                  amount: new Decimal(transaction.amount),
                  name: transaction.name,
                  merchant_name: transaction.merchant_name ?? null,
                  date: new Date(transaction.date),
                  authorized_date,
                  pending: transaction.pending,
                  iso_currency_code: transaction.iso_currency_code,
                },
              });
              modified++;
            } catch (err) {
              console.error(`Error updating transaction:`, err);
            }
          }

          for (let transaction of data.removed) {
            try {
              await transactionModel.deleteTransactionByPlaidId(
                transaction.transaction_id
              );
              removed++;
            } catch (err) {
              console.error(`Error removing transaction:`, err);
            }
          }

          hasMore = data.has_more;
          cursor = data.next_cursor;
        }

        await itemModel.updateItem({
          item_id: item.id,
          data: { transaction_cursor: cursor },
        });

        results.push({
          item_id: item.id,
          institution_name: item.institution_name,
          added,
          modified,
          removed,
        });
      } catch (err) {
        console.error(`Error syncing item ${item.id}:`, err);
        results.push({
          item_id: item.id,
          institution_name: item.institution_name,
          error: err instanceof Error ? err.message : "Sync failed",
        });
      }
    }

    res.status(200).json({
      success: true,
      results,
    });
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
    const { item_id } = req.params;
    const item = await itemModel.getItem({ id: item_id });

    if (!item) {
      throw new NotFoundError("Plaid item not found");
    }

    const { access_token } = item;
    const now = new Date().toISOString().split("T")[0];
    const past = new Date(Date.now() - 30 * 24 * 3600 * 1000)
      .toISOString()
      .split("T")[0];

    const result = await client.transactionsGet({
      access_token,
      start_date: past,
      end_date: now,
    });

    // console.log("transactions:", result.data);
    res.status(200).json(result.data);
  } catch (err) {
    next(err);
  }
};

export const removeItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      throw new BadRequestError("Access token required");
    }

    await client.itemRemove({ access_token });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
