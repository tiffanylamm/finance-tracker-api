import prisma from "./prisma";
import { Account, AccountWithInstitution } from "../types";

//create
export const insertAccount = async ({
  item_id,
  plaid_account_id,
  name,
  mask,
  balance,
}: {
  item_id: string;
  plaid_account_id: string;
  name: string;
  mask: string | null;
  balance: number | null;
}): Promise<Account> => {
  try {
    const account: Account = await prisma.account.create({
      data: {
        item_id,
        plaid_account_id,
        name,
        mask,
        balance,
      },
    });
    return account;
  } catch (err) {
    throw err;
  }
};

//read
export const getAccountById = async ({
  account_id,
}: {
  account_id: string;
}): Promise<AccountWithInstitution | null> => {
  try {
    const account: AccountWithInstitution | null =
      await prisma.account.findUnique({
        where: { id: account_id },
        include: {
          item: {
            select: {
              institution_id: true,
              institution_name: true,
            },
          },
        },
      });

    return account;
  } catch (err) {
    throw err;
  }
};

export const getUserAccounts = async (
  user_id: string
): Promise<AccountWithInstitution[]> => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        item: {
          user_id,
        },
      },
      include: {
        item: {
          select: {
            institution_id: true,
            institution_name: true,
          },
        },
      },
    });
    return accounts;
  } catch (err) {
    throw err;
  }
};

//update
export const updateAccount = async ({
  account_id,
  name,
}: {
  account_id: string;
  name: string;
}): Promise<Account> => {
  try {
    const account = await prisma.account.update({
      data: {
        name,
      },
      where: {
        id: account_id,
      },
    });
    return account;
  } catch (err) {
    throw err;
  }
};

//delete
export const deleteAccount = async ({
  account_id,
}: {
  account_id: string;
}): Promise<Account> => {
  try {
    const account = await prisma.account.delete({
      where: { id: account_id },
    });
    return account;
  } catch (err) {
    throw err;
  }
};

export const checkAccountOwnership = async ({
  account_id,
  user_id,
}: {
  account_id: string;
  user_id: string;
}): Promise<boolean> => {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: account_id,
        item: {
          user_id,
        },
      },
      select: {
        id: true,
      },
    });

    return !!account;
  } catch (err) {
    throw err;
  }
};
