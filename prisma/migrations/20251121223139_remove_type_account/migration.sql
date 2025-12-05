/*
  Warnings:

  - You are about to drop the column `subtype` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `accounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "subtype",
DROP COLUMN "type";
