import prisma from "./prisma";

//create

export const insertUser = async ({
  email,
  hashedPassword,
  name,
}: {
  email: string;
  hashedPassword: string;
  name: string;
}) => {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        name,
      },
    });
    return user;
  } catch (err) {
    throw err;
  }
};

//read

export const getUser = async (filter: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: filter,
    });
    return user;
  } catch (err) {
    throw err;
  }
};

//update

export const updateUser = async ({ id, data }: { id: string; data: any }) => {
  try {
    const user = await prisma.user.update({
      data,
      where: { id },
    });
    return user;
  } catch (err) {
    throw err;
  }
};

//delete
export const deleteUser = async ({ id }: { id: string }) => {
  try {
    const user = await prisma.user.delete({
      where: { id },
    });
  } catch (err) {
    throw err;
  }
};
