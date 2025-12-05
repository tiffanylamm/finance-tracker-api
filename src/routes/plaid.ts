import { Router } from "express";
import { verifyToken } from "../middleware /verifyUserToken";

import * as plaidController from "../controllers/plaidController";

const router = Router();

router.post("/create_link_token", verifyToken, plaidController.createLinkToken);

router.post("/exchange_public_token", verifyToken, plaidController.exchangePublicToken);

router.get("/items/:item_id/transactions", verifyToken, plaidController.getTransactions);

export default router;
