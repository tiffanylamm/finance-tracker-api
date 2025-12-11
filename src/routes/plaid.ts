import { Router } from "express";
import { verifyToken } from "../middleware /verifyUserToken";

import * as plaidController from "../controllers/plaidController";

const router = Router();

router.post("/create_link_token", verifyToken, plaidController.createLinkToken);

router.post(
  "/exchange_public_token",
  verifyToken,
  plaidController.exchangePublicToken
);

router.get(
  "/items/:item_id/transactions",
  verifyToken,
  plaidController.getTransactions
);

router.post("/remove_item", verifyToken, plaidController.removeItem);

router.post("/sync/:item_id", verifyToken, plaidController.syncTransactions);

router.post("/sync-all", verifyToken, plaidController.syncAllUserTransactions);

export default router;
