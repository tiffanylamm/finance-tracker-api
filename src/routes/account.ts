import express from "express";
import { verifyToken } from "../middleware /verifyUserToken";
import * as accountController from "../controllers/accountController";
import { authorizeAccountAccess } from "../middleware /accountAuthorization";

const router = express.Router();

router.get("/", verifyToken, accountController.getUserAccounts);

router.put(
  "/:account_id",
  verifyToken,
  authorizeAccountAccess,
  accountController.updateAccount
);

router.delete(
  "/:account_id",
  verifyToken,
  authorizeAccountAccess,
  accountController.deleteAccount
);

export default router;
