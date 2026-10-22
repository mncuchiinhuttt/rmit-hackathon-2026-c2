import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createDemoState } from "../model";
import { writeSimulationState } from "./sqlite-state";

export function openSimulationDatabase(filename: string): Database {
  if (filename !== ":memory:") mkdirSync(dirname(resolve(filename)), { recursive: true });
  const database = new Database(filename, { create: true, strict: true });
  try {
    database.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");
    database.transaction(() => {
      const version = database.query<{ user_version: number }, []>("PRAGMA user_version").get()!.user_version;
      if (version > 1) throw new Error("The simulation database schema is newer than this app.");
      if (version === 0) {
        database.exec(`
          CREATE TABLE simulation_cycles (
            record_id TEXT PRIMARY KEY, cycle_number INTEGER NOT NULL UNIQUE,
            sealed INTEGER NOT NULL CHECK (sealed IN (0,1)),
            redeemed INTEGER NOT NULL CHECK (redeemed IN (0,1)),
            sealed_at TEXT, ciphertext_bytes INTEGER NOT NULL CHECK (ciphertext_bytes >= 0)
          ) STRICT;
          CREATE TABLE simulation_approvals (
            record_id TEXT NOT NULL REFERENCES simulation_cycles(record_id) ON DELETE CASCADE,
            actor TEXT NOT NULL CHECK (actor IN ('hanh','tuan','mai')),
            PRIMARY KEY (record_id, actor)
          ) STRICT;
          CREATE TABLE simulation_events (
            id TEXT PRIMARY KEY, at TEXT NOT NULL, actor TEXT NOT NULL,
            action TEXT NOT NULL, record_id TEXT NOT NULL REFERENCES simulation_cycles(record_id)
          ) STRICT;
          CREATE TABLE simulation_sessions (
            token_hash TEXT PRIMARY KEY,
            actor TEXT NOT NULL CHECK (actor IN ('minh','hanh','tuan','mai','bao','operator')),
            expires_at INTEGER NOT NULL
          ) STRICT;
          PRAGMA user_version = 1;
        `);
        writeSimulationState(database, createDemoState());
      }
    }).immediate();
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}

let connection: Database | undefined;
export function simulationDatabase(): Database {
  return connection ??= openSimulationDatabase(resolve(process.env.HUI_SIMULATION_DB_PATH || "data/simulation.sqlite"));
}
