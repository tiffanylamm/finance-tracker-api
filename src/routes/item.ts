import express from "express";
import { verifyToken } from "../middleware /verifyUserToken";
import * as itemController from "../controllers/itemController";
const router = express.Router();

router.get("/", verifyToken, itemController.getUserItems);

export default router;