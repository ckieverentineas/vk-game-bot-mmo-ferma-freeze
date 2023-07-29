-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Builder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'energy',
    "income" REAL NOT NULL DEFAULT 1,
    "cost" REAL NOT NULL DEFAULT 100,
    "worker" INTEGER NOT NULL DEFAULT 1,
    "count" INTEGER NOT NULL DEFAULT 1,
    "id_user" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Builder_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Builder" ("cost", "count", "crdate", "id", "id_user", "income", "lvl", "name", "update", "worker", "xp") SELECT "cost", "count", "crdate", "id", "id_user", "income", "lvl", "name", "update", "worker", "xp" FROM "Builder";
DROP TABLE "Builder";
ALTER TABLE "new_Builder" RENAME TO "Builder";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
