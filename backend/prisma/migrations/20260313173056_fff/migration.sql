-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Achievement" ("description", "id", "key", "title", "unlockedAt") SELECT "description", "id", "key", "title", "unlockedAt" FROM "Achievement";
DROP TABLE "Achievement";
ALTER TABLE "new_Achievement" RENAME TO "Achievement";
CREATE UNIQUE INDEX "Achievement_userId_key_key" ON "Achievement"("userId", "key");
CREATE TABLE "new_QuizResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalWords" INTEGER NOT NULL,
    "correctWords" TEXT NOT NULL,
    "wrongWords" TEXT NOT NULL,
    "takenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "QuizResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QuizResult" ("correctWords", "date", "id", "score", "takenAt", "totalWords", "wrongWords") SELECT "correctWords", "date", "id", "score", "takenAt", "totalWords", "wrongWords" FROM "QuizResult";
DROP TABLE "QuizResult";
ALTER TABLE "new_QuizResult" RENAME TO "QuizResult";
CREATE TABLE "new_UserProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserProgress" ("id", "level", "longestStreak", "streak", "updatedAt", "xp") SELECT "id", "level", "longestStreak", "streak", "updatedAt", "xp" FROM "UserProgress";
DROP TABLE "UserProgress";
ALTER TABLE "new_UserProgress" RENAME TO "UserProgress";
CREATE UNIQUE INDEX "UserProgress_userId_key" ON "UserProgress"("userId");
CREATE TABLE "new_Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "english" TEXT NOT NULL,
    "mongolian" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'B2',
    "example" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAutoAdded" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'user',
    "deletedAt" DATETIME,
    "userId" TEXT,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "ease" REAL NOT NULL DEFAULT 2.5,
    "nextReviewAt" DATETIME,
    "lastReviewedAt" DATETIME,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "mastery" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Word_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Word" ("addedAt", "correctCount", "deletedAt", "ease", "english", "example", "id", "interval", "isAutoAdded", "lastReviewedAt", "level", "mastery", "mongolian", "nextReviewAt", "repetitions", "source", "wrongCount") SELECT "addedAt", "correctCount", "deletedAt", "ease", "english", "example", "id", "interval", "isAutoAdded", "lastReviewedAt", "level", "mastery", "mongolian", "nextReviewAt", "repetitions", "source", "wrongCount" FROM "Word";
DROP TABLE "Word";
ALTER TABLE "new_Word" RENAME TO "Word";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
