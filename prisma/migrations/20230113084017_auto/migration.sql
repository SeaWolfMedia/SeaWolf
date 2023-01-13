/*
  Warnings:

  - You are about to drop the column `test` on the `File` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatesPerformed" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "folderPath" TEXT,
    CONSTRAINT "File_folderPath_fkey" FOREIGN KEY ("folderPath") REFERENCES "Folder" ("path") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_File" ("createdAt", "folderPath", "id", "name", "path", "updatedAt", "updatesPerformed") SELECT "createdAt", "folderPath", "id", "name", "path", "updatedAt", "updatesPerformed" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
CREATE UNIQUE INDEX "File_path_key" ON "File"("path");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
