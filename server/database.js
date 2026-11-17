import mysql from "mysql2/promise";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = fileURLToPath(new URL("../", import.meta.url));
const defaultSqlitePath = resolve(root, "data", "wishes.sqlite");

function createSupabasePool(supabaseUrl, supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  return {
    isSupabase: true,
    async query(sql, params = []) {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith("SELECT COUNT(")) {
        const { count, error } = await supabase
          .from("wishes")
          .select("*", { count: "exact", head: true });
        if (error) {
          console.error("[Supabase] Count error:", error.message);
          return [[{ total: 0 }]];
        }
        return [[{ total: count || 0 }]];
      }

      const limit = Number(params[params.length - 1]) || 12;
      let query = supabase
        .from("wishes")
        .select("id, name, message, created_at")
        .order("id", { ascending: false })
        .limit(limit);

      if (params.length === 2 && params[0] !== undefined) {
        query = query.lt("id", Number(params[0]));
      }

      const { data, error } = await query;
      if (error) {
        console.error("[Supabase] Query error:", error.message);
        throw new Error(error.message || "Không thể tải lời chúc từ Supabase.");
      }

      const rows = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        message: row.message,
        createdAt: row.created_at,
      }));

      return [rows];
    },
    async execute(sql, params = []) {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith("INSERT INTO")) {
        const [name, message, createdAt] = params;
        const { data, error } = await supabase
          .from("wishes")
          .insert([
            {
              name,
              message,
              created_at:
                createdAt instanceof Date
                  ? createdAt.toISOString()
                  : createdAt || new Date().toISOString(),
            },
          ])
          .select("id, name, message, created_at")
          .single();

        if (error) {
          console.error("[Supabase] Insert error:", error.message);
          throw new Error(error.message || "Không thể lưu lời chúc vào Supabase.");
        }

        return [{ insertId: data.id, wish: data, affectedRows: 1 }];
      }

      if (trimmed.includes("WHERE ID = ?")) {
        const id = params[0];
        const { data, error } = await supabase
          .from("wishes")
          .select("id, name, message, created_at")
          .eq("id", id)
          .single();

        if (error) {
          console.error("[Supabase] Select by id error:", error.message);
          throw new Error(error.message || "Không tìm thấy lời chúc vừa tạo.");
        }

        return [
          [
            {
              id: data.id,
              name: data.name,
              message: data.message,
              createdAt: data.created_at,
            },
          ],
        ];
      }

      return [{ affectedRows: 0 }];
    },
    async end() {},
  };
}

function createSqlitePool(dbPath = defaultSqlitePath) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const sqlite = new DatabaseSync(dbPath);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  return {
    isSqlite: true,
    async query(sql, params = []) {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith("SELECT COUNT(")) {
        const stmt = sqlite.prepare("SELECT COUNT(*) AS total FROM wishes");
        const count = stmt.get();
        return [[{ total: count ? count.total : 0 }]];
      }
      const stmt = sqlite.prepare(sql);
      const rows = stmt.all(...params);
      return [rows];
    },
    async execute(sql, params = []) {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith("INSERT INTO")) {
        const stmt = sqlite.prepare(sql);
        const normalizedParams = params.map((p) =>
          p instanceof Date ? p.toISOString() : p,
        );
        const info = stmt.run(...normalizedParams);
        return [{ insertId: Number(info.lastInsertRowid), affectedRows: info.changes }];
      }
      if (trimmed.startsWith("SELECT")) {
        const stmt = sqlite.prepare(sql);
        const rows = stmt.all(...params);
        return [rows];
      }
      const stmt = sqlite.prepare(sql);
      const info = stmt.run(...params);
      return [{ affectedRows: info.changes }];
    },
    async end() {
      sqlite.close();
    },
  };
}

export function databaseOptions(env = process.env) {
  const connectionUrl = env.MYSQL_URL || env.MYSQL_PUBLIC_URL;
  if (connectionUrl) {
    let url;
    try {
      url = new URL(connectionUrl);
    } catch {
      throw new Error("MYSQL_URL phải là URL kết nối MySQL hợp lệ.");
    }
    if (url.protocol !== "mysql:" || !url.hostname || url.pathname.length < 2) {
      throw new Error("MYSQL_URL cần có dạng mysql://user:password@host:port/database.");
    }
    const isTiDB = url.hostname.includes("tidbcloud.com");
    return {
      uri: connectionUrl,
      ...(isTiDB || env.MYSQL_SSL === "true"
        ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }
        : {}),
    };
  }
  if (!env.MYSQLHOST || !env.MYSQLUSER || !env.MYSQLDATABASE || env.MYSQLPASSWORD === undefined) {
    return null;
  }
  const isTiDB = (env.MYSQLHOST || "").includes("tidbcloud.com");
  return {
    host: env.MYSQLHOST,
    port: Number(env.MYSQLPORT || 3306),
    user: env.MYSQLUSER,
    password: env.MYSQLPASSWORD,
    database: env.MYSQLDATABASE,
    ...(isTiDB || env.MYSQL_SSL === "true"
      ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }
      : {}),
  };
}

export async function connectDatabase(options = databaseOptions()) {
  const env = process.env;
  const supabaseUrl = env.SUPABASE_URL || "https://oylrfdodjqriceehawqt.supabase.co";
  const supabaseKey =
    env.SUPABASE_ANON_KEY ||
    env.SUPABASE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY;

  if (supabaseKey) {
    console.log(`[Database] Đang kết nối Supabase (${supabaseUrl})...`);
    return createSupabasePool(supabaseUrl, supabaseKey);
  }

  if (options) {
    try {
      const pool = mysql.createPool({
        ...options,
        charset: "utf8mb4",
        timezone: "Z",
        connectionLimit: 5,
        waitForConnections: true,
        queueLimit: 50,
        connectTimeout: 15_000,
      });
      await pool.query(`
        CREATE TABLE IF NOT EXISTS wishes (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(60) NOT NULL,
          message VARCHAR(600) NOT NULL,
          created_at DATETIME(3) NOT NULL,
          CONSTRAINT wishes_name_length CHECK (CHAR_LENGTH(name) BETWEEN 1 AND 60),
          CONSTRAINT wishes_message_length CHECK (CHAR_LENGTH(message) BETWEEN 1 AND 600)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      return pool;
    } catch (error) {
      if (process.env.MYSQL_STRICT === "true") {
        throw error;
      }
      console.warn(
        `[Database] Không thể kết nối MySQL (${error.code || error.message}). Tự động chuyển sang SQLite cục bộ để chạy thử nghiệm.`
      );
    }
  }

  console.log("[Database] Sử dụng SQLite cục bộ (data/wishes.sqlite) cho môi trường dev/review.");
  return createSqlitePool();
}
