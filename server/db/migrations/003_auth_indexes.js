/**
 * Migration 003 — Auth index hardening
 * - Ensures email index is unique
 * - Replaces non-unique OAuth indexes with sparse+unique variants
 * Safe to run on existing data (sparse allows multiple null values)
 */

const mongoose = require("mongoose");

class AuthIndexMigration {
  static async up() {
    console.log("[migration:003] Starting auth index hardening...");
    const col = mongoose.connection.db.collection("users");

    const toReplace = [
      { old: "oauth.google.id_1", field: "oauth.google.id" },
      { old: "oauth.github.id_1", field: "oauth.github.id" },
    ];

    for (const { old: oldName, field } of toReplace) {
      try {
        await col.dropIndex(oldName);
        console.log(`[migration:003] Dropped old index: ${oldName}`);
      } catch (_) {
        // Index didn't exist — fine
      }
      await col.createIndex(
        { [field]: 1 },
        { unique: true, sparse: true, background: true }
      );
      console.log(`[migration:003] Created sparse unique index on ${field}`);
    }

    // Ensure email index is unique (idempotent)
    try {
      await col.dropIndex("email_1");
    } catch (_) {}
    await col.createIndex({ email: 1 }, { unique: true, background: true });
    console.log("[migration:003] Email unique index verified");

    console.log("[migration:003] Done.");
  }

  static async down() {
    const col = mongoose.connection.db.collection("users");
    for (const field of ["oauth.google.id", "oauth.github.id"]) {
      try {
        await col.dropIndex(`${field.replace(/\./g, ".")}_1`);
      } catch (_) {}
      // Recreate as non-unique (original state)
      await col.createIndex({ [field]: 1 }, { background: true });
    }
    console.log("[migration:003] Rollback complete");
  }
}

module.exports = AuthIndexMigration;
