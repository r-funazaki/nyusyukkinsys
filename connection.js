/**
 * サンプルデータ投入
 */
const db = require('./connection');

console.log('シードデータを投入します...');

// 既存データクリア
db.exec(`DELETE FROM payments; DELETE FROM pdf_files; DELETE FROM import_logs;`);
db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('payments','pdf_files','import_logs');`);

const samples = [
  { date: '2026-04-20', kana: 'ヤマダ タロウ',     kanji: '山田 太郎',     amount: 15000, route: 'biz_form',   dispatch: '一般',   account: '00120-1-234567', commercial: '会員番号:A1024',   matched: 1, pdf: '20260420_山田太郎.pdf', note: '' },
  { date: '2026-04-20', kana: 'サトウ ハナコ',     kanji: '佐藤 花子',     amount: 8000,  route: 'counter_qr', dispatch: '速達',   account: '00120-1-234567', commercial: 'QR:A2048',         matched: 1, pdf: '20260420_佐藤花子.pdf', note: 'QR読取済' },
  { date: '2026-04-21', kana: 'タナカ ジロウ',     kanji: '田中 次郎',     amount: 25000, route: 'biz_form',   dispatch: '書留',   account: '00120-1-234567', commercial: '会員番号:A1099',   matched: 0, pdf: '',                       note: '' },
  { date: '2026-04-21', kana: 'スズキ イチロウ',   kanji: '鈴木 一郎',     amount: 12000, route: 'telegram',   dispatch: '一般',   account: '00120-1-234567', commercial: '',                 matched: 0, pdf: '',                       note: '電信扱い - 要照合' },
  { date: '2026-04-22', kana: 'タカハシ ミツコ',   kanji: '高橋 美津子',   amount: 5000,  route: 'shinou',     dispatch: 'メール便', account: '志納実績',     commercial: '志納番号:1090',     matched: 1, pdf: '20260422_高橋美津子.pdf', note: '1090志納実績' },
  { date: '2026-04-22', kana: 'ワタナベ ケンジ',   kanji: '渡辺 健司',     amount: 30000, route: 'biz_form',   dispatch: '書留',   account: '00120-1-234567', commercial: '会員番号:A2113',   matched: 1, pdf: '20260422_渡辺健司.pdf', note: '' },
  { date: '2026-04-23', kana: 'イトウ ユキコ',     kanji: '伊藤 由紀子',   amount: 18000, route: 'counter_qr', dispatch: '速達',   account: '00120-1-234567', commercial: 'QR:A2200',         matched: 0, pdf: '',                       note: '' },
  { date: '2026-04-23', kana: 'ナカムラ ハルキ',   kanji: '中村 春樹',     amount: 7500,  route: 'telegram',   dispatch: '一般',   account: '00120-1-234567', commercial: '',                 matched: 0, pdf: '',                       note: '差分照合中' },
  { date: '2026-04-24', kana: 'コバヤシ アキコ',   kanji: '小林 明子',     amount: 22000, route: 'biz_form',   dispatch: '一般',   account: '00120-1-234567', commercial: '会員番号:A2301',   matched: 0, pdf: '',                       note: '' },
  { date: '2026-04-24', kana: 'カトウ シンジ',     kanji: '加藤 真司',     amount: 9800,  route: 'counter_qr', dispatch: 'メール便', account: '00120-1-234567', commercial: 'QR:A2305',       matched: 1, pdf: '20260424_加藤真司.pdf', note: 'QR読取登録' }
];

const insert = db.prepare(`
  INSERT INTO payments (
    payment_date, name_kana, name_kanji, amount, route,
    dispatch_type, account_no, commercial, matched, pdf_filename, note, source
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((rows) => {
  for (const r of rows) {
    insert.run(
      r.date, r.kana, r.kanji, r.amount, r.route,
      r.dispatch, r.account, r.commercial, r.matched, r.pdf, r.note,
      r.matched ? 'csv' : (r.route === 'telegram' ? 'telegram' : 'csv')
    );
  }
});

insertMany(samples);
console.log(`✓ ${samples.length}件のサンプル入金データを投入しました`);

const count = db.prepare('SELECT COUNT(*) AS c FROM payments').get().c;
console.log(`  現在のpayments件数: ${count}`);
