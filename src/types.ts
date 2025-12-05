import { Decimal } from "@prisma/client/runtime/client";

export interface Account {
  id: string;
  item_id: string;
  plaid_account_id: string;
  name: string;
}

export interface Item {
  id: string;
  user_id: string;
  access_token: string;
  plaid_item_id: string;
  institution_name: string;
  created_at: Date;
  institution_id: string;
}

export interface Transaction {
  account_id: string;
  plaid_transaction_id: string;
  amount: Decimal;
  name: string;
  merchant_name: string | null;
  category: string[] | null;
  date: Date;
  authorized_date: Date | null;
  pending: boolean;
  iso_currency_code: string | null;
}
