/*
  Warnings:

  - Added the required column `totalVes` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "totalVes" DECIMAL(10,2) NOT NULL;
