/*
  Warnings:

  - Added the required column `institution_id` to the `items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "items" ADD COLUMN     "institution_id" TEXT NOT NULL;
