import * as userModel from "../models/userModel";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

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
    console.error(err);
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.insertUser({ email, hashedPassword, name });
    const token = generateJwtToken({ id: user.id, email, name });
    return res.status(201).json({
      message: "Successful Register",
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
    //get user
    const user = await userModel.getUser({ email });
    if (!user) {
      throw new Error("Username/Password Incorrect");
    }
    const match = await bcrypt.compare(password, user.hashedPassword);
    if (!match) {
      throw new Error("Username/Password Incorrect");
    }
    const token = generateJwtToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    return res.status(200).json({
      message: "Successful login",
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
      throw new Error("No data to update.");
    }

    const updatedUser = await userModel.updateUser({ id: user_id, data });
    return res
      .status(200)
      .json({ message: "Successfully updated user.", updatedUser });
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
    if (user_id !== req.user?.id) {
      throw new Error("Not authorized to delete user.");
    }
    await userModel.deleteUser({ id: user_id });
    res.status(200).json({ message: "User successfully deleted." });
  } catch (err) {
    next(err);
  }
};

// export interface AuthUser {
//   id: string;
//   email: string;
//   name: string;
// }
