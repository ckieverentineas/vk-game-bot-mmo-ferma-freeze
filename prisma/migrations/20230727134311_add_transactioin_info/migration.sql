-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Analyzer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "energy" REAL NOT NULL DEFAULT 0,
    "gold" REAL NOT NULL DEFAULT 0,
    "gold_from" REAL NOT NULL DEFAULT 0,
    "gold_to" REAL NOT NULL DEFAULT 0,
    "xp" REAL NOT NULL DEFAULT 0,
    "point" INTEGER NOT NULL DEFAULT 0,
    "id_user" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Analyzer_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Analyzer" ("crdate", "energy", "gold", "id", "id_user", "point", "xp") SELECT "crdate", "energy", "gold", "id", "id_user", "point", "xp" FROM "Analyzer";
DROP TABLE "Analyzer";
ALTER TABLE "new_Analyzer" RENAME TO "Analyzer";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
