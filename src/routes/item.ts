import express from "express";
import { verifyToken } from "../middleware /verifyUserToken";
import * as itemController from "../controllers/itemController";
const router = express.Router();

router.get("/", verifyToken, itemController.getUserItems);
router.delete("/:item_id", verifyToken, itemController.deleteItem);

export default router;
