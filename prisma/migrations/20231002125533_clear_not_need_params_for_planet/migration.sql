/*
  Warnings:

  - You are about to drop the column `slate` on the `Planet` table. All the data in the column will be lost.
  - You are about to drop the column `turf` on the `Planet` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Planet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "coal" REAL NOT NULL,
    "gas" REAL NOT NULL,
    "oil" REAL NOT NULL,
    "uranium" REAL NOT NULL,
    "iron" REAL NOT NULL,
    "golden" REAL NOT NULL,
    "crystal" REAL NOT NULL,
    "build" INTEGER NOT NULL DEFAULT 7,
    "artefact" REAL NOT NULL,
    "id_user" INTEGER,
    "id_system" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Planet_id_system_fkey" FOREIGN KEY ("id_system") REFERENCES "System" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Planet" ("artefact", "build", "coal", "crdate", "crystal", "gas", "golden", "id", "id_system", "id_user", "iron", "name", "oil", "update", "uranium") SELECT "artefact", "build", "coal", "crdate", "crystal", "gas", "golden", "id", "id_system", "id_user", "iron", "name", "oil", "update", "uranium" FROM "Planet";
DROP TABLE "Planet";
ALTER TABLE "new_Planet" RENAME TO "Planet";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
