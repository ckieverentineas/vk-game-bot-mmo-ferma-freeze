-- CreateTable
CREATE TABLE "Boss" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_post" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "hp" REAL NOT NULL,
    "artefact" REAL NOT NULL,
    "crystal" REAL NOT NULL
);
