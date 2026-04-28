/**
 * DB接続のシングルトン
 * Node.js 22+ の組込み node:sqlite を使用し、better-sqlite3 互換APIを提供。
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = path.join(__dirname, 'payment.db');
const raw = new DatabaseSync(DB_PATH);

try {
  raw.exec('PRAGMA journal_mode = WAL');
  raw.exec('PRAGMA foreign_keys = ON');
} catch (e) { /* 無視 */ }

/**
 * SQL中に出現する @名前 を抽出
 */
function extractNamedParams(sql) {
  const set = new Set();
  const re = /@([a-zA-Z_][a-zA-Z0-9_]*)/g;
  let m;
  while ((m = re.exec(sql)) !== null) set.add(m[1]);
  return set;
}

/**
 * better-sqlite3 互換ラッパ。
 * - run(args) / run(...args) → { changes, lastInsertRowid }
 * - 名前付きパラメータの場合、SQLに存在しないキーは自動で除外する
 *   （better-sqlite3 は許容するが node:sqlite は ERROR を投げるため）
 */
function prepare(sql) {
  const stmt = raw.prepare(sql);
  const allowed = extractNamedParams(sql);

  function call(method, args) {
    const single =
      args.length === 1 &&
      args[0] !== null &&
      typeof args[0] === 'object' &&
      !Array.isArray(args[0]);

    if (single) {
      // SQL中で実際に使われているキーのみに絞る
      const filtered = {};
      for (const k of Object.keys(args[0])) {
        if (allowed.has(k)) filtered[k] = args[0][k];
      }
      return stmt[method](filtered);
    }
    return stmt[method](...args);
  }

  return {
    run: (...args) => {
      const r = call('run', args);
      return { changes: r.changes, lastInsertRowid: r.lastInsertRowid };
    },
    get: (...args) => call('get', args),
    all: (...args) => call('all', args)
  };
}

function transaction(fn) {
  return function (...args) {
    raw.exec('BEGIN');
    try {
      const result = fn(...args);
      raw.exec('COMMIT');
      return result;
    } catch (e) {
      try { raw.exec('ROLLBACK'); } catch (_) {}
      throw e;
    }
  };
}

module.exports = {
  prepare,
  exec: (sql) => raw.exec(sql),
  transaction,
  pragma: (s) => raw.exec('PRAGMA ' + s),
  close: () => raw.close(),
  _raw: raw
};
