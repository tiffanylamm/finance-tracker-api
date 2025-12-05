import prisma from "./prisma";
import { Transaction } from "../types";

//create
export const insertTransaction = async ({
  account_id,
  plaid_transaction_id,
  amount,
  name,
  merchant_name,
  category,
  date,
  authorized_date,
  pending,
  iso_currency_code,
}: Transaction): Promise<Transaction> => {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        account_id,
        plaid_transaction_id,
        amount,
        name,
        merchant_name,
        ...(category && { category }),
        date,
        authorized_date,
        pending,
        iso_currency_code,
      },
    });
    return transaction;
  } catch (err) {
    throw err;
  }
};

//read

export const getTransactionById = async ({
  id,
}: {
  id: string;
}): Promise<Transaction> => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new Error("Transaction doesn't exist");
    }

    return transaction;
  } catch (err) {
    throw err;
  }
};

export const getUserTransactions = async ({
  user_id,
}: {
  user_id: string;
}): Promise<Transaction[]> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        account: {
          item: {
            user_id,
          },
        },
      },
      include: {
        account: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return transactions;
  } catch (err) {
    throw err;
  }
};

//update

export const updateTransaction = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}): Promise<Transaction> => {
  try {
    const transaction = await prisma.transaction.update({
      data,
      where: { id },
    });
    return transaction;
  } catch (err) {
    throw err;
  }
};

// shouldn't be able to delete transaction -- at least i wouldn't
