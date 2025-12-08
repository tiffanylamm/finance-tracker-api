import express from "express";
import * as userController from "../controllers/userController";
import { verifyToken } from "../middleware /verifyUserToken";
import { authorizeUserAccess } from "../middleware /userAuthorization";

const router = express.Router();

//create
router.post("/users", userController.register);

//read
router.post("/login", userController.login);

//update
router.put(
  "/users/:user_id",
  verifyToken,
  authorizeUserAccess,
  userController.updateUser
);

//delete
router.delete(
  "/users/:user_id",
  verifyToken,
  authorizeUserAccess,
  userController.deleteUser
);

export default router;
