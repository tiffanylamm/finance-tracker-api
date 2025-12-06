import "dotenv/config";
import express from "express";
import plaidRouter from "./routes/plaid";
import userRouter from "./routes/user";
import itemRouter from "./routes/item";
import accountRouter from "./routes/account";
import transactionRouter from "./routes/transactions";
import cors from "cors";
import { Products, Configuration, PlaidEnvironments, PlaidApi } from "plaid";
import { errorHandler } from "./middleware /errorHandler";
const PORT = process.env.PORT || 8000;

//these tokens should be in memory
let ACCESS_TOKEN = null;
let USER_TOKEN = null;
let PUBLIC_TOKEN = null;
let ITEM_ID = null;
let ACCOUNT_ID = null;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
//routes
app.use("/api/plaid", plaidRouter);
app.use("/api", userRouter);
app.use("/api/items", itemRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRouter);


//errorHandling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log("Listening on port:", PORT);
});
