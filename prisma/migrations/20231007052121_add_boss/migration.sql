/*
  Warnings:

  - You are about to drop the column `descriptin` on the `Boss` table. All the data in the column will be lost.
  - Added the required column `description` to the `Boss` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Boss" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_post" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hp" REAL NOT NULL,
    "artefact" REAL NOT NULL,
    "crystal" REAL NOT NULL
);
INSERT INTO "new_Boss" ("artefact", "crystal", "hp", "id", "id_post", "name") SELECT "artefact", "crystal", "hp", "id", "id_post", "name" FROM "Boss";
DROP TABLE "Boss";
ALTER TABLE "new_Boss" RENAME TO "Boss";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
