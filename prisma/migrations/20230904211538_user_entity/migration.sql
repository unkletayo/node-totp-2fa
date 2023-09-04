-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "otp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "otp_ascii" TEXT,
    "otp_hex" TEXT,
    "otp_base32" TEXT,
    "otp_auth_url" TEXT
);
INSERT INTO "new_users" ("email", "id", "name", "otp_ascii", "otp_auth_url", "otp_base32", "otp_enabled", "otp_hex", "otp_verified", "password") SELECT "email", "id", "name", "otp_ascii", "otp_auth_url", "otp_base32", "otp_enabled", "otp_hex", "otp_verified", "password" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
