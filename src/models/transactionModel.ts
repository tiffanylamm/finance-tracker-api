import prisma from "./prisma";
import { Transaction, TransactionWithAccountName } from "../types";
import { Decimal } from "@prisma/client/runtime/client";

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
}: {
  account_id: string;
  plaid_transaction_id: string;
  amount: Decimal;
  name: string;
  merchant_name: string | null;
  category: string[] | null;
  date: Date;
  authorized_date: Date | null;
  pending: boolean;
  iso_currency_code: string | null;
}): Promise<Transaction> => {
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

//helper functions
const buildStringFilter = (field: string, compare: string, value: any) => {
  switch (compare) {
    case "equals":
      return { [field]: value };
    case "contains":
      return { [field]: { contains: value, mode: "insensitive" } };
    case "not":
      return { [field]: { not: value } };
    default:
      return {};
  }
};

const buildNumberFilter = (field: string, compare: string, value: any) => {
  const numValue = parseFloat(value);
  switch (compare) {
    case "=":
      return { [field]: numValue };
    case ">":
      return { [field]: { gt: numValue } };
    case "<":
      return { [field]: { lt: numValue } };
    case ">=":
      return { [field]: { gte: numValue } };
    case "<=":
      return { [field]: { lte: numValue } };
    case "<":
      return { [field]: { not: numValue } };
    default:
      return {};
  }
};

const buildDateFilter = (field: string, compare: string, value: any) => {
  const dateValue = new Date(value);
  switch (compare) {
    case "=":
      const startOfDay = new Date(dateValue.setHours(0, 0, 0, 0));
      const endOfDay = new Date(dateValue.setHours(23, 59, 59, 999));
      return {
        [field]: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    case "<":
      return { [field]: { lt: dateValue } };
    case ">":
      return { [field]: { gt: dateValue } };
    case "<=":
      return { [field]: { lte: dateValue } };
    case ">=":
      return { [field]: { gte: dateValue } };
    default:
      return {};
  }
};

export const getUserTransactionsWithCursor = async ({
  user_id,
  limit,
  cursor,
  orderBy,
  filters,
}: {
  user_id: string;
  limit: number;
  cursor: string | undefined;
  orderBy: any;
  filters?: Array<{
    column: string;
    compare: string;
    value: any;
    extra?: "AND" | "OR" | null;
  }>;
}): Promise<TransactionWithAccountName[]> => {
  try {
    const whereClause: any = {
      account: {
        item: {
          user_id,
        },
      },
    };

    if (filters && filters.length > 0) {
      const filterConditions = filters.map((filter) => {
        const { column, compare, value } = filter;

        switch (column) {
          case "Merchant":
            return buildStringFilter("merchant_name", compare, value);
          case "Name":
            return buildStringFilter("name", compare, value);
          case "Category":
            return buildStringFilter("category", compare, value);
          case "Amount":
            return buildNumberFilter("amount", compare, value);
          case "Date":
            return buildDateFilter("date", compare, value);
          case "Pending":
            return { pending: value === "true" || value === true };
          case "Account":
            return {
              account: {
                name: buildStringFilter("name", compare, value).name,
              },
            };
          default:
            return {};
        }
      });

      //AND or OR
      const hasOrFilter = filters.some((filter) => filter.extra === "OR");

      if (hasOrFilter) {
        whereClause.OR = filterConditions;
      } else {
        whereClause.AND = filterConditions;
      }
    }

    // console.log("WHERE CLAUSE:", whereClause);

    const transactions: TransactionWithAccountName[] =
      await prisma.transaction.findMany({
        where: whereClause,
        orderBy,
        take: limit + 1,
        ...(cursor && {
          cursor: {
            id: cursor,
          },
          skip: 1,
        }),
        include: {
          account: {
            select: {
              name: true,
            },
          },
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
