import prisma from "./prisma";
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
}) => {
  try {
    const account = await prisma.account.create({
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
}) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: account_id },
      include: {
        item: {
          select: {
            institution_name: true,
          },
        },
      },
    });

    if (!account) {
      throw new Error("Account not found.");
    }
    return account;
  } catch (err) {
    throw err;
  }
};

export const getUserAccounts = async (user_id: string) => {
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
}) => {
  try {
    const updatedAccount = await prisma.account.update({
      data: {
        name,
      },
      where: {
        id: account_id,
      },
    });
    return updatedAccount;
  } catch (err) {
    throw err;
  }
};

//delete
export const deleteAccount = async ({ account_id }: { account_id: string }) => {
  try {
    const account = await prisma.account.delete({
      where: { id: account_id },
    });
    return account;
  } catch (err) {
    throw err;
  }
};
