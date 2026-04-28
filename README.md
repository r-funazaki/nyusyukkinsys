[README.md](https://github.com/user-attachments/files/27157786/README.md)
# 郵貯入出金管理システム モック (Node.js)

郵貯CSVデータを取り込んで入出金を管理する Web システムのモック実装です。
Express + better-sqlite3 によるバックエンドと、素のJavaScriptで作られたSPAフロントエンドで構成されています。

## 機能

- **CSV取込/出力** — 郵貯ビズCSVの取込（UTF-8 / Shift_JIS自動判定）、CSV_all出力
- **入金明細管理** — 一覧・検索・絞込・登録・編集・削除
- **PDF分割・リネーム** — 複数ページPDFを1ページずつ分割、命名規則によるリネーム、ZIP一括DL
- **CSV/PDF実績突合** — 手動・自動マッチング
- **個別入金登録** — 電信扱い等のCSV外入金を手動登録
- **QRコード読込** — 窓口QR支払の払込票読み取り（カメラ・画像）
- **帳票出力** — 入金集計表 / 入金明細表（画面表示・印刷・CSV出力）

## 振込経路の4分類

| 経路 | 払込用紙 | 説明 |
|------|---------|------|
| ① 郵貯ビズ振込 | あり | CSVから自動取込 |
| ② 窓口QR支払 | あり | QR読取で登録 |
| ③ 1090志納 | なし | 窓口・別途記録 |
| ④ 電信扱い | なし | CSVに含まれず、氏名カナ・金額・日付で個別照合 |

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# DB初期化（テーブル作成）
npm run init-db

# サンプルデータ投入（10件）
npm run seed

# サーバー起動
npm start
```

ブラウザで `http://localhost:3000` を開きます。

## 主要API

| メソッド | パス | 説明 |
|---------|------|------|
| GET | /api/health | ヘルスチェック |
| GET | /api/routes | 全エンドポイント一覧 |
| GET | /api/payments | 入金明細一覧（q, route, dispatch, matched, from, to で絞込） |
| POST | /api/payments | 入金登録 |
| PUT | /api/payments/:id | 更新 |
| DELETE | /api/payments/:id | 削除 |
| GET | /api/payments/stats/summary | 集計データ |
| POST | /api/csv/preview | CSVプレビュー |
| POST | /api/csv/import | CSV取込確定 |
| GET | /api/csv/export | CSV_all出力 |
| GET | /api/csv/sample | サンプルCSV DL |
| POST | /api/pdf/upload | PDFアップロード&自動分割 |
| GET | /api/pdf | PDF一覧 |
| GET | /api/pdf/zip | 一括ZIP DL |
| POST | /api/pdf/:id/link/:pid | 入金紐付 |
| POST | /api/qr/parse | QRテキスト解析 |
| GET | /api/reports/summary[.csv] | 集計表 |
| GET | /api/reports/detail[.csv] | 明細表 |

## ファイル構成

```
payment-mock/
├── package.json
├── server.js               Express エントリポイント
├── db/
│   ├── init.js            DB初期化
│   ├── seed.js            サンプルデータ投入
│   ├── connection.js      DB接続シングルトン
│   └── payment.db         SQLite DB（実行時生成）
├── routes/
│   ├── payments.js        入金CRUD・統計・自動突合
│   ├── csv.js             CSV取込・出力
│   ├── pdf.js             PDF分割・リネーム・ZIP・紐付
│   └── misc.js            QR・帳票
├── public/
│   ├── index.html         SPA HTML
│   ├── styles.css         スタイル
│   └── app.js             APIクライアントJS
└── uploads/
    ├── csv/               CSV保管
    ├── pdf/               PDF一時保管
    └── split/             分割後PDF
```

## 技術スタック

- **バックエンド**: Express 4 / better-sqlite3 11 / multer / pdf-lib / archiver
- **CSV**: csv-parse / csv-stringify / iconv-lite (Shift_JIS対応)
- **フロントエンド**: 純粋なJavaScript（フレームワークなし）/ html5-qrcode (CDN)
- **DB**: SQLite

## 注意事項

- これは業務要件確認用のモックです。本番運用には認証・権限・監査ログ等の追加実装が必要です
- CSVのフォーマットは部分一致でフィールドを解決していますが、実際の郵貯データに合わせて調整してください
- PDFの命名規則は `{prefix}_{YYYYMMDD}_{元名}_p{NN}.pdf` です
