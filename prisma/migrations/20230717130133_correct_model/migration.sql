-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Worker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 1,
    "xp" REAL NOT NULL DEFAULT 0,
    "income" REAL NOT NULL DEFAULT 0,
    "speed" REAL NOT NULL DEFAULT 1,
    "salary" REAL NOT NULL DEFAULT 1,
    "gold" REAL NOT NULL DEFAULT 0,
    "reputation" REAL NOT NULL DEFAULT 0,
    "point" INTEGER NOT NULL DEFAULT 0,
    "id_user" INTEGER NOT NULL,
    "id_builder" INTEGER NOT NULL DEFAULT 0,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Worker_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Worker_id_builder_fkey" FOREIGN KEY ("id_builder") REFERENCES "Builder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Worker" ("crdate", "gold", "id", "id_builder", "id_user", "income", "lvl", "name", "point", "reputation", "salary", "speed", "update", "xp") SELECT "crdate", "gold", "id", "id_builder", "id_user", "income", "lvl", "name", "point", "reputation", "salary", "speed", "update", "xp" FROM "Worker";
DROP TABLE "Worker";
ALTER TABLE "new_Worker" RENAME TO "Worker";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
