import prisma from "./prisma";
import { User } from "../types";

//create

export const insertUser = async ({
  email,
  hashedPassword,
  name,
}: {
  email: string;
  hashedPassword: string;
  name: string;
}): Promise<User> => {
  try {
    const user: User = await prisma.user.create({
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

export const getUser = async (filter: any): Promise<User | null> => {
  try {
    const user: User | null = await prisma.user.findUnique({
      where: filter,
    });

    return user;
  } catch (err) {
    throw err;
  }
};

//update

export const updateUser = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}): Promise<User> => {
  try {
    const user: User = await prisma.user.update({
      data,
      where: { id },
    });
    return user;
  } catch (err) {
    throw err;
  }
};

//delete

export const deleteUser = async ({ id }: { id: string }): Promise<User> => {
  try {
    const user: User = await prisma.user.delete({
      where: { id },
    });
    return user;
  } catch (err) {
    throw err;
  }
};
