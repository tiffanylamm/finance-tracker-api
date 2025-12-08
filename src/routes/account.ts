import express from "express";
import { verifyToken } from "../middleware /verifyUserToken";
import * as accountController from "../controllers/accountController";
const router = express.Router();

router.get("/", verifyToken, accountController.getUserAccounts);

router.put("/:account_id", verifyToken, accountController.updateAccount);

router.delete("/:account_id", verifyToken, accountController.deleteAccount);

export default router;
