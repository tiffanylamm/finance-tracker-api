import prisma from "./prisma";

//create
export const insertItem = async ({
  user_id,
  access_token,
  plaid_item_id,
  institution_name,
  institution_id,
}: {
  user_id: string;
  access_token: string;
  plaid_item_id: string;
  institution_name: string;
  institution_id: string;
}) => {
  try {
    const item = await prisma.item.create({
      data: {
        user_id,
        access_token,
        plaid_item_id,
        institution_name,
        institution_id,
      },
    });
    return item;
  } catch (err) {
    throw err;
  }
};

//read
export const getItem = async (filter: any) => {
  try {
    const item = await prisma.item.findUnique({
      where: filter,
    });
    return item;
  } catch (err) {
    throw err;
  }
};

export const getUserItems = async (user_id: string) => {
  try {
    const items = await prisma.item.findMany({
      where: {
        user_id,
      },
    });
    return items;
  } catch (err) {
    throw err;
  }
};

//update
export const updateItem = async ({
  item_id,
  data,
}: {
  item_id: string;
  data: any;
}) => {
  try {
    const item = await prisma.item.update({
      data,
      where: { id: item_id },
    });
    return item;
  } catch (err) {
    throw err;
  }
};

//delete
export const deleteItem = async ({ item_id }: { item_id: string }) => {
  try {
    const item = await prisma.item.delete({
      where: {
        id: item_id,
      },
    });
    return item;
  } catch (err) {
    throw err;
  }
};
