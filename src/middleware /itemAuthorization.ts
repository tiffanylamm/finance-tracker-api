import { Request, Response, NextFunction } from "express";
import * as itemModel from "../models/itemModel";
import { ForbiddenError } from "../errors";

export const authorizeItemAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { item_id } = req.params;
    const { id: user_id } = req.user;

    const belongsToUser = await itemModel.checkItemOwnership({
      item_id,
      user_id,
    });

    if (!belongsToUser) {
      throw new ForbiddenError("You don't have access to this item");
    }

    next();
  } catch (err) {
    next(err);
  }
};
