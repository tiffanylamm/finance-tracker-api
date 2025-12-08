import * as userModel from "../models/userModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../types";

const generateJwtToken = ({
  id,
  email,
  name,
}: {
  id: string;
  email: string;
  name: string;
}) => {
  try {
    if (!id || !email || !name) {
      throw new Error("Missing required fields for JWT Token.");
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_Secret is not defined.");
    }
    return jwt.sign({ id, email, name }, process.env.JWT_SECRET, {
      expiresIn: "2d",
    });
  } catch (err) {
    throw err;
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword: string = await bcrypt.hash(password, 10);
    const user: User = await userModel.insertUser({
      email,
      hashedPassword,
      name,
    });
    const token: string = generateJwtToken({ id: user.id, email, name });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user: User | null = await userModel.getUser({ email });

    if (!user) {
      throw new Error("Username/Password Incorrect");
    }

    const match: boolean = await bcrypt.compare(password, user.hashedPassword);

    if (!match) {
      throw new Error("Username/Password Incorrect");
    }
    const token: string = generateJwtToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return res.status(200).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
};

//update
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id } = req.params;
    const { email, name } = req.body;

    const data: Record<string, any> = {};
    if (email) data.email = email;
    if (name) data.name = name;

    if (Object.keys(data).length === 0) {
      throw new Error("No data to update");
    }

    const user: User = await userModel.updateUser({ id: user_id, data });
    return res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user_id } = req.params;

    await userModel.deleteUser({ id: user_id });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
