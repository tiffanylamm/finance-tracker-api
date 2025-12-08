/*
  Warnings:

  - Added the required column `balance` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mask` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "balance" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "mask" TEXT NOT NULL;
