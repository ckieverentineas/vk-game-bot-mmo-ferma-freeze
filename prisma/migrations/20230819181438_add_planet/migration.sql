/*
  Warnings:

  - You are about to alter the column `planet` on the `System` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_System" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "planet" REAL NOT NULL
);
INSERT INTO "new_System" ("id", "name", "planet") SELECT "id", "name", "planet" FROM "System";
DROP TABLE "System";
ALTER TABLE "new_System" RENAME TO "System";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
