-- Creator:       MySQL Workbench 8.0.41/ExportSQLite Plugin 0.1.0
-- Author:        david
-- Caption:       New Model
-- Project:       Name of the project
-- Changed:       2026-01-21 20:20
-- Created:       2025-11-16 20:15

-- Schema: mydb
BEGIN;
CREATE TABLE "role"(
  "role_id" INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT NULL,
  "name" VARCHAR(50) NOT NULL,
  CONSTRAINT "role_id"
    UNIQUE("name")
);
CREATE TABLE "user"(
  "user_id" INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT NULL,
  "email" VARCHAR(100) NOT NULL,
  "username" VARCHAR(50) NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "is_active" INTEGER DEFAULT TRUE,
  "role_id" INTEGER NOT NULL,
  CONSTRAINT "user_id"
    UNIQUE("email"),
  CONSTRAINT "username"
    UNIQUE("username"),
  FOREIGN KEY("role_id")
    REFERENCES "role"("role_id")
);
CREATE INDEX "user.role_id" ON "user" ("role_id");
CREATE TABLE "budget"(
  "budget_id" INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT NULL,
  "name" VARCHAR(100) NOT NULL,
  "currency" VARCHAR(10) NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE DEFAULT NULL,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "budget_user"(
  "budget_user_id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" INTEGER NOT NULL,
  "budget_id" INTEGER NOT NULL,
  "type" TEXT NOT NULL CHECK("type" IN ('OWNER', 'CONTRIBUTOR')),
  CONSTRAINT "budget_user_unique" UNIQUE("budget_id","user_id"),
  FOREIGN KEY("user_id") REFERENCES "user"("user_id")
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  FOREIGN KEY("budget_id") REFERENCES "budget"("budget_id")
);
CREATE INDEX "budget_user.user" ON "budget_user" ("user_id");
CREATE TABLE "category"(
  "category_id" INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(255) DEFAULT NULL,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "transaction"(
  "transaction_id" INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT NULL,
  "category_id" INTEGER NOT NULL,
  "budget_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "amount" DECIMAL NOT NULL,
  "currency" VARCHAR(10) NOT NULL,
  "type" TEXT NOT NULL CHECK("type" IN('INCOME', 'EXPENSE')),
  "date" DATE NOT NULL,
  "description" VARCHAR(255) DEFAULT NULL,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY("category_id")
    REFERENCES "category"("category_id"),
  FOREIGN KEY("budget_id")
    REFERENCES "budget"("budget_id"),
  FOREIGN KEY("user_id")
    REFERENCES "user"("user_id")
);
CREATE INDEX "transaction.index2" ON "transaction" ("category_id");
CREATE INDEX "transaction.index3" ON "transaction" ("budget_id");
CREATE INDEX "transaction.index4" ON "transaction" ("user_id");
CREATE TABLE "budget_goal"(
  "goal_id" INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT NULL,
  "budget_id" INTEGER NOT NULL,
  "category_id" INTEGER NOT NULL,
  "limit_amount" DECIMAL DEFAULT NULL,
  "goal_amount" DECIMAL DEFAULT NULL,
  "period" TEXT NOT NULL CHECK("period" IN('WEEKLY', 'MONTHLY', 'YEARLY')),
  FOREIGN KEY("budget_id")
    REFERENCES "budget"("budget_id")
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  FOREIGN KEY("category_id")
    REFERENCES "category"("category_id")
);
CREATE INDEX "budget_goal.index2" ON "budget_goal" ("budget_id");
CREATE INDEX "budget_goal.index3" ON "budget_goal" ("category_id");
CREATE TABLE "audit_log"(
  "audit_id" INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT NULL,
  "user_id" INTEGER NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "entity_changed" VARCHAR(100) NOT NULL,
  "entity_id" INTEGER NOT NULL,
  "details" TEXT DEFAULT NULL,
  "timestamp" DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY("user_id")
    REFERENCES "user"("user_id")
);
CREATE INDEX "audit_log.audit_id" ON "audit_log" ("user_id");
COMMIT;