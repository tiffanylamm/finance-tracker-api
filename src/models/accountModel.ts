import prisma from "./prisma";
import { Account, AccountWithInstitution } from "../types";
import { client } from "../controllers/plaidController";

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

export const getAccountsByItemId = async (
  item_id: string
): Promise<Account[]> => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        item_id,
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
}): Promise<void> => {
  try {
    await prisma.$transaction(async (tx) => {
      //delete account
      const account = await tx.account.delete({
        where: { id: account_id },
      });

      const itemId = account.item_id;

      //check for remaining accounts
      const remainingAccountsCount = await tx.account.count({
        where: { item_id: itemId },
      });

      //delete item if count = 0
      if (remainingAccountsCount === 0) {
        const item = await tx.item.findUnique({
          where: {
            id: itemId,
          },
        });

        await tx.item.delete({
          where: { id: itemId },
        });

        if (item?.access_token) {
          try {
            await client.itemRemove({ access_token: item.access_token });
          } catch (plaidErr) {
            console.warn("Plaid removal failed:", plaidErr);
          }
        }
      }
    });
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
