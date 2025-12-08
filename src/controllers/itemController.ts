import { error } from "console";
import { Request, Response, NextFunction } from "express";
import * as itemModel from "../models/itemModel";
import { Item } from "../types";

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
    const item: Item = await itemModel.insertItem({
      user_id,
      access_token,
      plaid_item_id,
      institution_name,
      institution_id,
    });
    res.send(201).json({ item });
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
    const item: Item | null = await itemModel.getItem({ id: item_id });

    if (!item) {
      throw new Error("Item not found");
    }

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
    const items: Item[] = await itemModel.getUserItems(user_id);
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
    res.status(204).send();
  } catch (err) {
    next(error);
  }
};
