<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>郵貯入出金管理システム</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&family=Noto+Serif+JP:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js"></script>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<div class="app">
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">郵貯入出金管理</div>
      <div class="sidebar-subtitle">Payment Admin · Node.js Mock</div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-title">メイン</div>
      <div class="nav-item active" data-view="dashboard"><span class="nav-icon">▣</span><span>ダッシュボード</span></div>
      <div class="nav-item" data-view="import"><span class="nav-icon">↥</span><span>CSV取込</span></div>
      <div class="nav-item" data-view="payments"><span class="nav-icon">≡</span><span>入金明細一覧</span></div>
      <div class="nav-item" data-view="register"><span class="nav-icon">＋</span><span>個別入金登録</span></div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-title">機能</div>
      <div class="nav-item" data-view="qr"><span class="nav-icon">⬛</span><span>QRコード読込</span></div>
      <div class="nav-item" data-view="pdf"><span class="nav-icon">⎙</span><span>PDF分割・リネーム</span></div>
      <div class="nav-item" data-view="match"><span class="nav-icon">⇄</span><span>CSV/PDF実績突合</span></div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-title">出力</div>
      <div class="nav-item" data-view="export"><span class="nav-icon">↧</span><span>CSV_all出力</span></div>
      <div class="nav-item" data-view="reports"><span class="nav-icon">⊞</span><span>帳票出力</span></div>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-title">システム</div>
      <div class="nav-item" data-view="api"><span class="nav-icon">⌘</span><span>APIエンドポイント</span></div>
    </div>
  </aside>

  <main class="main" id="main"></main>
</div>

<div class="notifications" id="notifications"></div>
<div id="modal-root"></div>

<script src="/app.js"></script>
</body>
</html>
