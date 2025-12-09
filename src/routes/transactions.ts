import express from "express";
import { verifyToken } from "../middleware /verifyUserToken";
import * as transactionController from "../controllers/transactionController";
import { authorizeTransactionAccess } from "../middleware /transactionAuthorization";

const router = express.Router();

router.get("/", verifyToken, transactionController.getTransactions);

router.get(
  "/:transaction_id",
  verifyToken,
  authorizeTransactionAccess,
  transactionController.getTransaction
);

export default router;
