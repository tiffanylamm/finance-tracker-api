import express from "express";
import * as userController from "../controllers/userController";
import * as transactionController from "../controllers/transactionController";
import * as accountController from "../controllers/accountController";
import { verifyToken } from "../middleware /verifyUserToken";
const router = express.Router();

//create
router.post("/users", userController.register);

//read
router.post("/login", userController.login);

//update
router.put("/users/:user_id", verifyToken, userController.updateUser);

//delete
router.delete("/users/:user_id", verifyToken, userController.deleteUser);

export default router;
