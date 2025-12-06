import { error } from "console";
import * as itemModel from "../models/itemModel";
import { Request, Response, NextFunction } from "express";

export const createItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      user_id,
      access_token,
      plaid_item_id,
      institution_name,
      institution_id,
    } = req.body;
    const item = await itemModel.insertItem({
      user_id,
      access_token,
      plaid_item_id,
      institution_name,
      institution_id,
    });
    res.send(201).json({ message: "Item successfully created.", item });
  } catch (err) {
    next(err);
  }
};

export const getItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item_id: string = req.params.item_id;
    const item = await itemModel.getItem({ id: item_id });
    res.send(200).json({ item });
  } catch (err) {
    next(err);
  }
};

export const getUserItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = req.user.id;
    const items = await itemModel.getUserItems(user_id);
    res.status(200).json({ items });
  } catch (err) {
    next(err);
  }
};

export const deleteItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item_id: string = req.params.item_id;
    await itemModel.deleteItem({ item_id });
    res.send(200).json({ message: "Item successfully deleted" });
  } catch (err) {
    next(error);
  }
};
