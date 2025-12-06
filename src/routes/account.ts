import express from "express";
import { verifyToken } from "../middleware /verifyUserToken";
import * as accountController from "../controllers/accountController";
const router = express.Router();

router.get("/", verifyToken, accountController.getUserAccounts);

export default router;
