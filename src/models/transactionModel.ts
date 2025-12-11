import prisma from "./prisma";
import { Transaction, TransactionWithAccountName } from "../types";

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
    const transaction: Transaction = await prisma.transaction.create({
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
}): Promise<Transaction | null> => {
  try {
    const transaction: Transaction | null = await prisma.transaction.findUnique(
      {
        where: { id },
      }
    );

    return transaction;
  } catch (err) {
    throw err;
  }
};

export const getUserTransactions = async ({
  user_id,
}: {
  user_id: string;
}): Promise<TransactionWithAccountName[]> => {
  try {
    const transactions: TransactionWithAccountName[] =
      await prisma.transaction.findMany({
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
    const transaction: Transaction = await prisma.transaction.update({
      data,
      where: { id },
    });
    return transaction;
  } catch (err) {
    throw err;
  }
};

// shouldn't be able to delete transaction -- at least i wouldn't
export const deleteTransactionByPlaidId = async (
  plaidId: string
): Promise<Transaction> => {
  try {
    const transaction: Transaction = await prisma.transaction.delete({
      where: {
        plaid_transaction_id: plaidId,
      },
    });
    return transaction;
  } catch (err) {
    throw err;
  }
};

export const checkTransactionOwnership = async ({
  transaction_id,
  user_id,
}: {
  transaction_id: string;
  user_id: string;
}): Promise<boolean> => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transaction_id,
        account: {
          item: {
            user_id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    return !!transaction;
  } catch (err) {
    throw err;
  }
};
