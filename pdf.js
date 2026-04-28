/**
 * QR・帳票 API
 *  POST /api/qr/parse              QRデータ解析（クライアントから渡されたテキスト）
 *  POST /api/qr/register           QR読取データを入金登録
 *  GET  /api/reports/summary       入金集計表
 *  GET  /api/reports/detail        入金明細表
 *  GET  /api/reports/summary.csv   集計CSV
 *  GET  /api/reports/detail.csv    明細CSV
 */
const express = require('express');
const { stringify } = require('csv-stringify/sync');
const db = require('../db/connection');

const router = express.Router();

const ROUTE_LABELS = {
  biz_form: '郵貯ビズ振込', counter_qr: '窓口QR支払',
  shinou: '1090志納', telegram: '電信扱い'
};

// ====================================================================
// QR
// ====================================================================
function parseQRText(text) {
  // JSONを試す
  try {
    const j = JSON.parse(text);
    return { format: 'json', data: j };
  } catch (e) {}
  // key=value 形式
  const data = {};
  text.split(/[\n;&]/).forEach(part => {
    const m = part.match(/^([^=:]+)[=:](.+)$/);
    if (m) data[m[1].trim()] = m[2].trim();
  });
  return { format: 'kv', data };
}

router.post('/qr/parse', (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'textが必要' });
  const parsed = parseQRText(text);
  // 共通フィールドにマップ
  const d = parsed.data;
  const norm = {
    payee: d.payee || d['受取人'] || '',
    account: d.account || d['口座番号'] || '',
    amount: parseInt(String(d.amount || d['金額'] || '').replace(/[^\d]/g, ''), 10) || 0,
    payer_kana: d.payer_kana || d.name || d['氏名カナ'] || '',
    commercial: d.commercial || d['コマーシャル'] || '',
    date: (() => {
      const raw = String(d.date || d['日付'] || '');
      if (/^\d{8}$/.test(raw)) return `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
      return raw;
    })()
  };
  res.json({ format: parsed.format, raw: parsed.data, normalized: norm });
});

router.post('/qr/register', (req, res) => {
  const b = req.body || {};
  if (!b.payer_kana || !b.amount) {
    return res.status(400).json({ error: '氏名カナと金額は必須' });
  }
  const r = db.prepare(`
    INSERT INTO payments (
      payment_date, name_kana, amount, route, dispatch_type,
      account_no, commercial, source, note
    ) VALUES (?, ?, ?, 'counter_qr', ?, ?, ?, 'qr', 'QR読取登録')
  `).run(
    b.date || new Date().toISOString().slice(0, 10),
    b.payer_kana,
    Number(b.amount),
    b.dispatch_type || '一般',
    b.account || '',
    b.commercial || ''
  );
  res.status(201).json(db.prepare('SELECT * FROM payments WHERE id = ?').get(r.lastInsertRowid));
});

// ====================================================================
// 帳票 - 集計
// ====================================================================
function fetchSummary(from, to) {
  const conds = [];
  const params = {};
  if (from) { conds.push('payment_date >= @from'); params.from = from; }
  if (to) { conds.push('payment_date <= @to'); params.to = to; }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount FROM payments ${where}`).get(params);
  const byRoute = db.prepare(`
    SELECT route, COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount
    FROM payments ${where} GROUP BY route
  `).all(params);
  const byDispatch = db.prepare(`
    SELECT route, COALESCE(dispatch_type,'(未設定)') AS dispatch_type, COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount
    FROM payments ${where} GROUP BY route, dispatch_type ORDER BY route, dispatch_type
  `).all(params);

  return { from: from || null, to: to || null, total, byRoute, byDispatch };
}

router.get('/reports/summary', (req, res) => {
  res.json(fetchSummary(req.query.from, req.query.to));
});

router.get('/reports/summary.csv', (req, res) => {
  const data = fetchSummary(req.query.from, req.query.to);
  const rows = [['振込経路', '発送種別', '件数', '金額', '構成比']];
  for (const r of data.byRoute) {
    const dispatches = data.byDispatch.filter(d => d.route === r.route);
    const pct = data.total.amount > 0 ? ((r.amount / data.total.amount) * 100).toFixed(1) : '0.0';
    rows.push([ROUTE_LABELS[r.route] || r.route, '小計', r.count, r.amount, pct + '%']);
    for (const d of dispatches) {
      const dpct = data.total.amount > 0 ? ((d.amount / data.total.amount) * 100).toFixed(1) : '0.0';
      rows.push(['', '└ ' + d.dispatch_type, d.count, d.amount, dpct + '%']);
    }
  }
  rows.push(['合計', '', data.total.count, data.total.amount, '100.0%']);

  const csv = stringify(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="summary_${new Date().toISOString().slice(0,10)}.csv"`);
  res.send('\ufeff' + csv);
});

// ====================================================================
// 帳票 - 明細
// ====================================================================
function fetchDetail(from, to) {
  const conds = [];
  const params = {};
  if (from) { conds.push('payment_date >= @from'); params.from = from; }
  if (to) { conds.push('payment_date <= @to'); params.to = to; }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  return db.prepare(`SELECT * FROM payments ${where} ORDER BY payment_date, id`).all(params);
}

router.get('/reports/detail', (req, res) => {
  const rows = fetchDetail(req.query.from, req.query.to);
  res.json({ from: req.query.from || null, to: req.query.to || null, rows });
});

router.get('/reports/detail.csv', (req, res) => {
  const rows = fetchDetail(req.query.from, req.query.to);
  const csvRows = [['取扱日', '氏名カナ', '氏名漢字', '経路', '発送種別', '金額', 'コマーシャル', '突合']];
  for (const p of rows) {
    csvRows.push([
      p.payment_date,
      p.name_kana,
      p.name_kanji || '',
      ROUTE_LABELS[p.route] || p.route,
      p.dispatch_type || '',
      p.amount,
      p.commercial || '',
      p.matched ? '○' : '−'
    ]);
  }
  const total = rows.reduce((s, r) => s + r.amount, 0);
  csvRows.push(['合計', '', '', '', '', total, '', '']);

  const csv = stringify(csvRows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="detail_${new Date().toISOString().slice(0,10)}.csv"`);
  res.send('\ufeff' + csv);
});

module.exports = router;
