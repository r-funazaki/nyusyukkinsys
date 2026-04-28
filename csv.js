// ====================================================================
// 郵貯入出金管理システム フロントエンド (API連携版)
// ====================================================================

const ROUTES = {
  biz_form:    { label: '郵貯ビズ振込', cls: 'badge-bizf', desc: '①払込用紙あり / ビズ振込' },
  counter_qr:  { label: '窓口QR支払',   cls: 'badge-qr',  desc: '②払込用紙あり / 窓口・QR読取' },
  shinou:      { label: '1090志納',     cls: 'badge-shinou', desc: '③払込用紙なし / 窓口支払' },
  telegram:    { label: '電信扱い',     cls: 'badge-telegram', desc: '④払込用紙なし / 口座振込' }
};

const DISPATCH_TYPES = ['一般', '速達', '書留', 'メール便', 'ゆうパック', 'レターパック'];

// ====================================================================
// API クライアント
// ====================================================================
const API = {
  base: '',

  async req(path, opts = {}) {
    const res = await fetch(this.base + path, {
      headers: opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {},
      ...opts
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'API error');
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('json')) return res.json();
    if (ct.includes('csv') || ct.includes('zip') || ct.includes('pdf')) return res.blob();
    return res.text();
  },

  payments: {
    list: (params = {}) => API.req('/api/payments?' + new URLSearchParams(params)),
    get: (id) => API.req(`/api/payments/${id}`),
    create: (data) => API.req('/api/payments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => API.req(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => API.req(`/api/payments/${id}`, { method: 'DELETE' }),
    summary: (params = {}) => API.req('/api/payments/stats/summary?' + new URLSearchParams(params)),
    autoMatch: () => API.req('/api/payments/match/auto', { method: 'POST' })
  },

  csv: {
    preview: (file) => {
      const fd = new FormData(); fd.append('file', file);
      return API.req('/api/csv/preview', { method: 'POST', body: fd });
    },
    import: (file, defaults) => {
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(defaults).forEach(([k, v]) => fd.append(k, v));
      return API.req('/api/csv/import', { method: 'POST', body: fd });
    },
    exportUrl: (params) => '/api/csv/export?' + new URLSearchParams(params),
    sampleUrl: () => '/api/csv/sample'
  },

  pdf: {
    upload: (files, prefix = '') => {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append('files', f));
      if (prefix) fd.append('prefix', prefix);
      return API.req('/api/pdf/upload', { method: 'POST', body: fd });
    },
    list: (linked) => API.req('/api/pdf' + (linked != null ? '?linked=' + linked : '')),
    rename: (id, filename) => API.req(`/api/pdf/${id}/rename`, {
      method: 'PUT', body: JSON.stringify({ filename })
    }),
    delete: (id) => API.req(`/api/pdf/${id}`, { method: 'DELETE' }),
    link: (pdfId, paymentId) => API.req(`/api/pdf/${pdfId}/link/${paymentId}`, { method: 'POST' }),
    downloadUrl: (id) => `/api/pdf/${id}/download`,
    zipUrl: () => '/api/pdf/zip'
  },

  qr: {
    parse: (text) => API.req('/api/qr/parse', { method: 'POST', body: JSON.stringify({ text }) }),
    register: (data) => API.req('/api/qr/register', { method: 'POST', body: JSON.stringify(data) })
  },

  reports: {
    summary: (params = {}) => API.req('/api/reports/summary?' + new URLSearchParams(params)),
    detail: (params = {}) => API.req('/api/reports/detail?' + new URLSearchParams(params)),
    summaryCsvUrl: (params) => '/api/reports/summary.csv?' + new URLSearchParams(params),
    detailCsvUrl: (params) => '/api/reports/detail.csv?' + new URLSearchParams(params)
  },

  routes: () => API.req('/api/routes'),
  health: () => API.req('/api/health')
};

// ====================================================================
// ヘルパ
// ====================================================================
const yen = n => '¥' + Number(n || 0).toLocaleString('ja-JP');
const escHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function notify(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = 'notification ' + type;
  el.textContent = msg;
  document.getElementById('notifications').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function downloadUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  if (filename) a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

// ====================================================================
// ビュー
// ====================================================================
const Views = {

// ----------- ダッシュボード -----------
async dashboard() {
  const summary = await API.payments.summary();
  const recentRes = await API.payments.list({ limit: 5 });
  const recent = recentRes.data;
  const today = new Date().toISOString().slice(0, 10);

  // ルート別の安定したマップ
  const byRoute = {};
  Object.keys(ROUTES).forEach(k => byRoute[k] = { count: 0, amount: 0 });
  summary.byRoute.forEach(r => byRoute[r.route] = { count: r.count, amount: r.amount });

  return `
    <div class="page-header">
      <div class="page-title-group">
        <h1>ダッシュボード</h1>
        <div class="page-subtitle">入金状況サマリ ／ ${today}</div>
      </div>
      <div class="page-actions">
        <button class="btn" onclick="App.navigate('import')">＋ CSV取込</button>
        <button class="btn btn-primary" onclick="App.navigate('export')">↧ CSV_all出力</button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">入金件数</div>
        <div class="stat-value">${summary.total.count}<span class="stat-suffix">件</span></div>
        <div class="stat-detail">全期間累計</div>
      </div>
      <div class="stat-card accent">
        <div class="stat-label">入金総額</div>
        <div class="stat-value">${yen(summary.total.amount)}</div>
        <div class="stat-detail">全期間累計</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">突合済</div>
        <div class="stat-value">${summary.matched.count}<span class="stat-suffix">件</span></div>
        <div class="stat-detail">${yen(summary.matched.amount)}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">未突合・要確認</div>
        <div class="stat-value">${summary.unmatched.count}<span class="stat-suffix">件</span></div>
        <div class="stat-detail">${yen(summary.unmatched.amount)}</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><div class="panel-title">振込経路別 集計</div></div>
      <div class="panel-body">
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead><tr><th>経路</th><th>説明</th><th class="num">件数</th><th class="num">金額</th><th class="num">構成比</th></tr></thead>
            <tbody>
              ${Object.entries(ROUTES).map(([key, r]) => {
                const d = byRoute[key];
                const pct = summary.total.amount > 0 ? ((d.amount / summary.total.amount) * 100).toFixed(1) : '0.0';
                return `<tr>
                  <td><span class="badge ${r.cls}">${r.label}</span></td>
                  <td class="text-sm text-muted">${r.desc}</td>
                  <td class="num">${d.count}</td>
                  <td class="num">${yen(d.amount)}</td>
                  <td class="num">${pct}%</td>
                </tr>`;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="font-weight:600; background:var(--bg-tertiary);">
                <td colspan="2">合計</td>
                <td class="num">${summary.total.count}</td>
                <td class="num">${yen(summary.total.amount)}</td>
                <td class="num">100.0%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">直近の入金</div>
        <button class="btn btn-sm" onclick="App.navigate('payments')">すべて表示 →</button>
      </div>
      <div class="panel-body" style="padding:0;">
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead><tr><th>日付</th><th>氏名</th><th>経路</th><th>発送種別</th><th class="num">金額</th><th class="center">突合</th></tr></thead>
            <tbody>
              ${recent.map(p => `
                <tr>
                  <td class="font-mono">${p.payment_date}</td>
                  <td>${escHTML(p.name_kanji || p.name_kana)}<div class="text-sm text-muted">${escHTML(p.name_kana)}</div></td>
                  <td><span class="badge ${ROUTES[p.route].cls}">${ROUTES[p.route].label}</span></td>
                  <td>${escHTML(p.dispatch_type || '')}</td>
                  <td class="num">${yen(p.amount)}</td>
                  <td class="center">${p.matched ? '<span class="badge badge-success">突合済</span>' : '<span class="badge badge-warning">未突合</span>'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
},

// ----------- CSV取込 -----------
async import() {
  return `
    <div class="page-header">
      <div class="page-title-group">
        <h1>CSV取込</h1>
        <div class="page-subtitle">郵貯ビズデータの取り込み</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><div class="panel-title">ファイルアップロード</div></div>
      <div class="panel-body">
        <div class="dropzone" id="csv-drop">
          <div class="dropzone-icon">↥</div>
          <div class="dropzone-text">CSVファイルをドラッグ＆ドロップ または クリックで選択</div>
          <div class="dropzone-hint">対応：UTF-8 / Shift_JIS</div>
          <input type="file" id="csv-file-input" accept=".csv" style="display:none;">
        </div>

        <div class="mt-3">
          <div class="section-title">取込ルール</div>
          <ul style="font-size:13px; color:var(--text-secondary); padding-left:20px; line-height:1.9;">
            <li>払込用紙あり ／ <strong>郵貯ビズ振込（①）</strong> ＋ <strong>窓口QR支払（②）</strong>はCSVから自動取込</li>
            <li>払込用紙なし ／ <strong>窓口支払（③）</strong>は1090志納実績で別途記録</li>
            <li>払込用紙なし ／ <strong>電信扱い（④）</strong>はCSVに含まれないため、氏名カナ・金額・日付で個別照合が必要</li>
          </ul>
        </div>

        <div class="divider-line"></div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">経路の既定値</label>
            <select class="form-select" id="import-route-default">
              <option value="biz_form">郵貯ビズ振込（①）</option>
              <option value="counter_qr">窓口QR支払（②）</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">取込日（既定）</label>
            <input type="date" class="form-input" id="import-date" value="${new Date().toISOString().slice(0,10)}">
          </div>
          <div class="form-group">
            <label class="form-label">発送種別の既定値</label>
            <select class="form-select" id="import-dispatch-default">
              ${DISPATCH_TYPES.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="panel" id="csv-preview" style="display:none;">
      <div class="panel-header">
        <div class="panel-title">取込プレビュー</div>
        <div>
          <button class="btn" onclick="ImportView.cancel()">キャンセル</button>
          <button class="btn btn-accent" onclick="ImportView.commit()">取込を確定</button>
        </div>
      </div>
      <div class="panel-body" id="csv-preview-body"></div>
    </div>

    <div class="panel">
      <div class="panel-header"><div class="panel-title">CSVフォーマット仕様（参考）</div></div>
      <div class="panel-body">
        <div class="table-wrapper" style="border:none;">
          <table class="data-table">
            <thead><tr><th>項目名</th><th>必須</th><th>説明</th><th>例</th></tr></thead>
            <tbody>
              <tr><td>取扱日</td><td class="center">●</td><td>払込日</td><td class="font-mono">2026-04-20</td></tr>
              <tr><td>氏名カナ</td><td class="center">●</td><td>払込人氏名</td><td>ヤマダ タロウ</td></tr>
              <tr><td>氏名漢字</td><td></td><td>払込人氏名</td><td>山田 太郎</td></tr>
              <tr><td>金額</td><td class="center">●</td><td>払込金額</td><td class="font-mono">15000</td></tr>
              <tr><td>口座番号</td><td></td><td>振込先口座</td><td class="font-mono">00120-1-234567</td></tr>
              <tr><td>コマーシャル</td><td></td><td>備考・会員番号等</td><td>会員番号:A1024</td></tr>
              <tr><td>発送種別</td><td></td><td>★追加カラム</td><td>速達 / 書留 等</td></tr>
            </tbody>
          </table>
        </div>
        <div class="mt-3">
          <a href="/api/csv/sample" class="btn btn-sm" download>↧ サンプルCSVをダウンロード</a>
        </div>
      </div>
    </div>
  `;
},

// ----------- 入金明細一覧 -----------
async payments() {
  return `
    <div class="page-header">
      <div class="page-title-group">
        <h1>入金明細一覧</h1>
        <div class="page-subtitle" id="payments-subtitle">読込中...</div>
      </div>
      <div class="page-actions">
        <button class="btn" onclick="App.navigate('register')">＋ 個別登録</button>
        <button class="btn btn-primary" onclick="PaymentsView.exportFiltered()">↧ 表示中をCSV出力</button>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-search">
        <span>⌕</span>
        <input type="text" placeholder="氏名・金額・コマーシャルで検索" id="filter-q" oninput="PaymentsView.refresh()">
      </div>
      <select class="form-select" id="filter-route" onchange="PaymentsView.refresh()">
        <option value="">経路（すべて）</option>
        ${Object.entries(ROUTES).map(([k,r]) => `<option value="${k}">${r.label}</option>`).join('')}
      </select>
      <select class="form-select" id="filter-dispatch" onchange="PaymentsView.refresh()">
        <option value="">発送種別（すべて）</option>
        ${DISPATCH_TYPES.map(d => `<option value="${d}">${d}</option>`).join('')}
      </select>
      <select class="form-select" id="filter-match" onchange="PaymentsView.refresh()">
        <option value="">突合（すべて）</option>
        <option value="matched">突合済のみ</option>
        <option value="unmatched">未突合のみ</option>
      </select>
      <input type="date" class="form-input" id="filter-from" onchange="PaymentsView.refresh()" title="開始日">
      <input type="date" class="form-input" id="filter-to" onchange="PaymentsView.refresh()" title="終了日">
    </div>

    <div class="table-wrapper">
      <table class="data-table" id="payments-table">
        <thead>
          <tr>
            <th>ID</th><th>取扱日</th><th>氏名カナ</th><th>氏名</th>
            <th>経路</th><th>発送種別</th><th class="num">金額</th>
            <th>コマーシャル</th><th>PDF</th><th class="center">突合</th><th class="center">操作</th>
          </tr>
        </thead>
        <tbody id="payments-tbody"><tr><td colspan="11" class="empty-state">読込中...</td></tr></tbody>
      </table>
    </div>
  `;
},

// ----------- 個別登録 -----------
async register() {
  const today = new Date().toISOString().slice(0,10);
  return `
    <div class="page-header">
      <div class="page-title-group">
        <h1>個別入金登録</h1>
        <div class="page-subtitle">電信扱いや志納実績など、CSV外の入金を手動登録</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><div class="panel-title">入金情報</div></div>
      <div class="panel-body">
        <div class="form-grid">
          <div class="form-group"><label class="form-label">取扱日 <span style="color:var(--accent);">*</span></label><input type="date" class="form-input" id="reg-date" value="${today}"></div>
          <div class="form-group"><label class="form-label">振込経路 <span style="color:var(--accent);">*</span></label>
            <select class="form-select" id="reg-route">
              ${Object.entries(ROUTES).map(([k,r]) => `<option value="${k}">${r.label} - ${r.desc}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">発送種別</label>
            <select class="form-select" id="reg-dispatch">
              ${DISPATCH_TYPES.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">氏名カナ <span style="color:var(--accent);">*</span></label><input type="text" class="form-input" id="reg-name" placeholder="ヤマダ タロウ"></div>
          <div class="form-group"><label class="form-label">氏名（漢字）</label><input type="text" class="form-input" id="reg-name-kanji" placeholder="山田 太郎"></div>
          <div class="form-group"><label class="form-label">金額（円） <span style="color:var(--accent);">*</span></label><input type="number" class="form-input" id="reg-amount" placeholder="0" min="0"></div>
          <div class="form-group"><label class="form-label">口座番号</label><input type="text" class="form-input" id="reg-account" placeholder="00120-1-234567"></div>
          <div class="form-group"><label class="form-label">コマーシャル / 備考</label><input type="text" class="form-input" id="reg-commercial" placeholder="会員番号など"></div>
        </div>

        <div class="form-group" style="margin-top:14px;">
          <label class="form-label">メモ</label>
          <textarea class="form-textarea" id="reg-note" placeholder="特記事項（電信扱いの場合は照合経緯など）"></textarea>
        </div>

        <div style="margin-top:20px; display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn" onclick="RegisterView.reset()">クリア</button>
          <button class="btn btn-accent" onclick="RegisterView.submit()">登録する</button>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><div class="panel-title">電信扱い（④）の照合フロー</div></div>
      <div class="panel-body">
        <div style="font-size:13px; line-height:1.9; color:var(--text-secondary);">
          <p><strong style="color:var(--text-primary);">電信扱い入金の課題：</strong>口座には入金されるがCSVデータには含まれず、コマーシャルデータもないため個人特定が困難です。</p>
          <ol style="padding-left:20px; margin-top:8px;">
            <li><strong>差分の特定：</strong>1日全体の口座入金額 − CSVデータ金額の差分から、電信扱い入金の合計額を算出</li>
            <li><strong>判別要素：</strong>氏名カナ・金額・日付の3項目で個別の入金を特定</li>
            <li><strong>登録：</strong>本画面で経路を「電信扱い」として手動登録</li>
            <li><strong>突合：</strong>「CSV/PDF実績突合」画面でPDFと紐付け</li>
          </ol>
        </div>
      </div>
    </div>
  `;
},

// ----------- QR -----------
async qr() {
  return `
    <div class="page-header">
      <div class="page-title-group">
        <h1>QRコード読込</h1>
        <div class="page-subtitle">窓口QR支払（②）の払込票QRを読み取り</div>
      </div>
    </div>

    <div class="qr-section">
      <div class="qr-reader-box">
        <div id="qr-reader"></div>
        <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
          <button class="btn btn-accent" id="qr-start-btn" onclick="QRView.start()">▶ カメラ起動</button>
          <button class="btn" id="qr-stop-btn" onclick="QRView.stop()" style="display:none;">■ 停止</button>
          <label class="btn">画像から読取
            <input type="file" accept="image/*" style="display:none;" onchange="QRView.scanFile(event)">
          </label>
        </div>
        <div id="qr-result" style="margin-top:16px; width:100%;"></div>
      </div>

      <div class="qr-sample-box">
        <h3>QRコードサンプル仕様</h3>
        <svg class="qr-sample-img" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="white"/>
          <g fill="black">
            <rect x="10" y="10" width="50" height="50"/>
            <rect x="18" y="18" width="34" height="34" fill="white"/>
            <rect x="24" y="24" width="22" height="22"/>
            <rect x="140" y="10" width="50" height="50"/>
            <rect x="148" y="18" width="34" height="34" fill="white"/>
            <rect x="154" y="24" width="22" height="22"/>
            <rect x="10" y="140" width="50" height="50"/>
            <rect x="18" y="148" width="34" height="34" fill="white"/>
            <rect x="24" y="154" width="22" height="22"/>
            <rect x="70" y="15" width="6" height="6"/><rect x="82" y="15" width="6" height="6"/><rect x="94" y="22" width="6" height="6"/><rect x="106" y="15" width="6" height="6"/><rect x="118" y="22" width="6" height="6"/><rect x="130" y="15" width="6" height="6"/>
            <rect x="76" y="28" width="6" height="6"/><rect x="88" y="28" width="6" height="6"/><rect x="100" y="35" width="6" height="6"/><rect x="112" y="28" width="6" height="6"/><rect x="124" y="35" width="6" height="6"/>
            <rect x="70" y="42" width="6" height="6"/><rect x="82" y="42" width="6" height="6"/><rect x="94" y="49" width="6" height="6"/><rect x="106" y="42" width="6" height="6"/><rect x="118" y="49" width="6" height="6"/><rect x="130" y="42" width="6" height="6"/>
            <rect x="15" y="70" width="6" height="6"/><rect x="27" y="77" width="6" height="6"/><rect x="39" y="70" width="6" height="6"/><rect x="51" y="77" width="6" height="6"/>
            <rect x="63" y="70" width="6" height="6"/><rect x="75" y="77" width="6" height="6"/><rect x="87" y="70" width="6" height="6"/><rect x="99" y="84" width="6" height="6"/><rect x="111" y="77" width="6" height="6"/><rect x="123" y="70" width="6" height="6"/><rect x="135" y="84" width="6" height="6"/><rect x="147" y="77" width="6" height="6"/><rect x="159" y="70" width="6" height="6"/><rect x="171" y="84" width="6" height="6"/><rect x="183" y="77" width="6" height="6"/>
            <rect x="21" y="91" width="6" height="6"/><rect x="33" y="98" width="6" height="6"/><rect x="45" y="91" width="6" height="6"/>
            <rect x="69" y="98" width="6" height="6"/><rect x="81" y="91" width="6" height="6"/><rect x="93" y="105" width="6" height="6"/><rect x="105" y="98" width="6" height="6"/><rect x="117" y="105" width="6" height="6"/><rect x="129" y="98" width="6" height="6"/><rect x="141" y="91" width="6" height="6"/><rect x="153" y="105" width="6" height="6"/><rect x="165" y="98" width="6" height="6"/><rect x="177" y="91" width="6" height="6"/>
            <rect x="15" y="112" width="6" height="6"/><rect x="27" y="119" width="6" height="6"/><rect x="39" y="112" width="6" height="6"/><rect x="51" y="119" width="6" height="6"/>
            <rect x="75" y="112" width="6" height="6"/><rect x="87" y="119" width="6" height="6"/><rect x="99" y="126" width="6" height="6"/><rect x="111" y="119" width="6" height="6"/><rect x="123" y="112" width="6" height="6"/><rect x="135" y="126" width="6" height="6"/><rect x="147" y="119" width="6" height="6"/><rect x="159" y="112" width="6" height="6"/><rect x="171" y="126" width="6" height="6"/><rect x="183" y="119" width="6" height="6"/>
            <rect x="21" y="133" width="6" height="6"/>
            <rect x="69" y="140" width="6" height="6"/><rect x="81" y="133" width="6" height="6"/><rect x="93" y="147" width="6" height="6"/><rect x="105" y="140" width="6" height="6"/><rect x="117" y="147" width="6" height="6"/><rect x="129" y="140" width="6" height="6"/><rect x="141" y="133" width="6" height="6"/><rect x="153" y="147" width="6" height="6"/><rect x="165" y="140" width="6" height="6"/><rect x="177" y="133" width="6" height="6"/>
            <rect x="75" y="154" width="6" height="6"/><rect x="87" y="161" width="6" height="6"/><rect x="99" y="168" width="6" height="6"/><rect x="111" y="161" width="6" height="6"/><rect x="123" y="154" width="6" height="6"/><rect x="135" y="168" width="6" height="6"/><rect x="147" y="161" width="6" height="6"/><rect x="159" y="154" width="6" height="6"/><rect x="171" y="168" width="6" height="6"/><rect x="183" y="161" width="6" height="6"/>
            <rect x="69" y="175" width="6" height="6"/><rect x="81" y="182" width="6" height="6"/><rect x="93" y="175" width="6" height="6"/><rect x="105" y="182" width="6" height="6"/><rect x="117" y="175" width="6" height="6"/><rect x="129" y="182" width="6" height="6"/><rect x="141" y="175" width="6" height="6"/><rect x="153" y="182" width="6" height="6"/>
          </g>
        </svg>
        <div class="qr-fields">
          <div class="qr-field-row"><span class="qr-field-key">フォーマット</span><span class="qr-field-val">JSON / key=value</span></div>
          <div class="qr-field-row"><span class="qr-field-key">payee</span><span class="qr-field-val">団体名</span></div>
          <div class="qr-field-row"><span class="qr-field-key">account</span><span class="qr-field-val">00120-1-234567</span></div>
          <div class="qr-field-row"><span class="qr-field-key">amount</span><span class="qr-field-val">15000</span></div>
          <div class="qr-field-row"><span class="qr-field-key">payer_kana</span><span class="qr-field-val">ヤマダ タロウ</span></div>
          <div class="qr-field-row"><span class="qr-field-key">commercial</span><span class="qr-field-val">A1024</span></div>
          <div class="qr-field-row"><span class="qr-field-key">date</span><span class="qr-field-val">YYYYMMDD</span></div>
        </div>
        <div style="margin-top:12px;">
          <button class="btn btn-sm" onclick="QRView.fillSample()">サンプルQRデータで登録テスト</button>
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top:20px;">
      <div class="panel-header"><div class="panel-title">読取データの登録</div></div>
      <div class="panel-body">
        <div class="form-grid">
          <div class="form-group"><label class="form-label">取扱日</label><input type="date" class="form-input" id="qr-date" value="${new Date().toISOString().slice(0,10)}"></div>
          <div class="form-group"><label class="form-label">氏名カナ</label><input type="text" class="form-input" id="qr-name"></div>
          <div class="form-group"><label class="form-label">金額</label><input type="number" class="form-input" id="qr-amount"></div>
          <div class="form-group"><label class="form-label">コマーシャル</label><input type="text" class="form-input" id="qr-commercial"></div>
          <div class="form-group"><label class="form-label">発送種別</label><select class="form-select" id="qr-dispatch">${DISPATCH_TYPES.map(d=>`<option>${d}</option>`).join('')}</select></div>
        </div>
        <div style="margin-top:14px; text-align:right;">
          <button class="btn btn-accent" onclick="QRView.register()">この内容で登録</button>
        </div>
      </div>
    </div>
  `;
},

// ----------- PDF -----------
async pdf() {
  return `
    <div class="page-header">
      <div class="page-title-group">
        <h1>PDF分割・リネーム</h1>
        <div class="page-subtitle">複数ページのPDFを1ページずつ分割し、命名規則に従ってリネーム</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><div class="panel-title">PDFアップロード</div></div>
      <div class="panel-body">
        <div class="dropzone" id="pdf-drop">
          <div class="dropzone-icon">⎙</div>
          <div class="dropzone-text">PDFファイルをドラッグ＆ドロップ または クリックで選択</div>
          <div class="dropzone-hint">複数ページPDFを1ページずつサーバ側で分割します</div>
          <input type="file" id="pdf-file-input" accept=".pdf" style="display:none;" multiple>
        </div>
        <div class="form-grid mt-3">
          <div class="form-group">
            <label class="form-label">プレフィックス（任意）</label>
            <input type="text" class="form-input" id="pdf-prefix" placeholder="例: 202604">
          </div>
        </div>
      </div>
    </div>

    <div class="panel" id="pdf-list-panel">
      <div class="panel-header">
        <div class="panel-title">PDF一覧 <span id="pdf-count" class="text-sm text-muted"></span></div>
        <div>
          <button class="btn" onclick="PDFView.refresh()">⟳ 更新</button>
          <a class="btn btn-accent" href="/api/pdf/zip" download>↧ ZIPで一括DL</a>
        </div>
      </div>
      <div class="panel-body">
        <div class="pdf-list" id="pdf-list"><div class="empty-state">読込中...</div></div>
      </div>
    </div>
  `;
},

// ----------- 突合 -----------
async match() {
  return `
    <div class="page-header">
      <div class="page-title-group">
        <h1>CSV/PDF実績突合</h1>
        <div class="page-subtitle">入金データとPDF実績の紐付け作業</div>
      </div>
    </div>

    <div class="stats-grid" id="match-stats"></div>

    <div class="match-grid">
      <div class="match-side">
        <div class="match-header">
          <span class="match-side-title">未突合の入金</span>
          <span class="text-sm text-muted" id="match-payment-count"></span>
        </div>
        <div class="match-list" id="match-payments-list"><div class="empty-state">読込中...</div></div>
      </div>

      <div class="match-side">
        <div class="match-header">
          <span class="match-side-title">PDF実績</span>
          <span class="text-sm text-muted" id="match-pdf-count"></span>
        </div>
        <div class="match-list" id="match-pdfs-list"><div class="empty-state">読込中...</div></div>
      </div>
    </div>

    <div class="panel mt-3">
      <div class="panel-header"><div class="panel-title">突合候補の自動検出</div></div>
      <div class="panel-body">
        <p style="font-size:13px; color:var(--text-secondary); margin-bottom:12px;">氏名カナ・金額・日付の一致度から自動マッチング候補を検出します。</p>
        <button class="btn btn-primary" onclick="MatchView.autoMatch()">⚙ 自動マッチング実行</button>
      </div>
    </div>
  `;
},

// ----------- CSV出力 -----------
async export() {
  return `
    <div class="page-header">
      <div class="page-title-group">
        <h1>CSV_all出力</h1>
        <div class="page-subtitle">全入金データの一括出力</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><div class="panel-title">出力条件</div></div>
      <div class="panel-body">
        <div class="form-grid">
          <div class="form-group"><label class="form-label">期間（開始）</label><input type="date" class="form-input" id="exp-from"></div>
          <div class="form-group"><label class="form-label">期間（終了）</label><input type="date" class="form-input" id="exp-to"></div>
          <div class="form-group"><label class="form-label">経路</label>
            <select class="form-select" id="exp-route">
              <option value="">すべて</option>
              ${Object.entries(ROUTES).map(([k,r]) => `<option value="${k}">${r.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">突合状態</label>
            <select class="form-select" id="exp-match">
              <option value="">すべて</option>
              <option value="matched">突合済のみ</option>
              <option value="unmatched">未突合のみ</option>
            </select>
          </div>
        </div>

        <div class="divider-line"></div>

        <div class="section-title">出力カラム</div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:8px;">
          ${[
            ['id','ID'],['payment_date','取扱日'],['name_kana','氏名カナ'],['name_kanji','氏名漢字'],
            ['amount','金額'],['route','経路'],['dispatch_type','発送種別 ★追加'],
            ['account_no','口座番号'],['commercial','コマーシャル'],['matched','突合状態'],
            ['pdf_filename','PDFファイル名'],['note','メモ'],['source','取込元'],['created_at','登録日時']
          ].map(([k,label]) => `
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
              <input type="checkbox" name="exp-col" value="${k}" checked> <span style="font-size:13px;">${label}</span>
            </label>`).join('')}
        </div>

        <div style="margin-top:20px; display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn" onclick="ExportView.preview()">プレビュー</button>
          <button class="btn btn-accent" onclick="ExportView.download()">↧ CSVダウンロード</button>
        </div>
      </div>
    </div>

    <div class="panel" id="exp-preview-panel" style="display:none;">
      <div class="panel-header">
        <div class="panel-title">プレビュー</div>
        <span class="text-sm text-muted" id="exp-preview-count"></span>
      </div>
      <div class="panel-body" style="padding:0;">
        <div class="table-wrapper" style="border:none; max-height:400px;">
          <table class="data-table" id="exp-preview-table"></table>
        </div>
      </div>
    </div>
  `;
},

// ----------- 帳票 -----------
async reports() {
  return `
    <div class="page-header">
      <div class="page-title-group">
        <h1>帳票出力</h1>
        <div class="page-subtitle">入金集計表 ／ 入金明細表</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="report-card" onclick="ReportView.show('summary')">
        <div class="report-icon">⊞</div>
        <div class="report-title">入金集計表</div>
        <div class="report-desc">期間内の入金を経路別・発送種別別に集計</div>
      </div>
      <div class="report-card" onclick="ReportView.show('detail')">
        <div class="report-icon">≡</div>
        <div class="report-title">入金明細表</div>
        <div class="report-desc">期間内の全入金を1件ずつ明細表示</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><div class="panel-title">出力期間</div></div>
      <div class="panel-body">
        <div class="form-grid">
          <div class="form-group"><label class="form-label">開始日</label><input type="date" class="form-input" id="rep-from"></div>
          <div class="form-group"><label class="form-label">終了日</label><input type="date" class="form-input" id="rep-to"></div>
        </div>
      </div>
    </div>

    <div id="report-output"></div>
  `;
},

// ----------- API一覧 -----------
async api() {
  const data = await API.routes();
  const health = await API.health();
  return `
    <div class="page-header">
      <div class="page-title-group">
        <h1>APIエンドポイント</h1>
        <div class="page-subtitle">サーバーで提供しているAPI一覧</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card success">
        <div class="stat-label">サーバ状態</div>
        <div class="stat-value">${health.status}</div>
        <div class="stat-detail">${health.server}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">バージョン</div>
        <div class="stat-value">${health.version}</div>
        <div class="stat-detail">${new Date(health.time).toLocaleString('ja-JP')}</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><div class="panel-title">エンドポイント一覧</div></div>
      <div class="panel-body" style="padding:0;">
        <div class="api-list">
          ${data.endpoints.map(line => {
            if (!line) return '<br>';
            if (line.startsWith('---')) return `<div class="api-section">${escHTML(line)}</div>`;
            const m = line.match(/^(\S+)\s+(\S+)\s*(.*)$/);
            if (m) return `<div><span class="api-method">${escHTML(m[1])}</span> <span style="color:#fff;">${escHTML(m[2])}</span> <span style="color:rgba(245,243,238,0.5);">${escHTML(m[3])}</span></div>`;
            return `<div>${escHTML(line)}</div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

}; // Views

// ====================================================================
// アプリ コア
// ====================================================================
const App = {
  currentView: 'dashboard',
  currentPayments: [],

  async init() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => this.navigate(el.dataset.view));
    });
    await this.render();
  },

  async navigate(view) {
    this.currentView = view;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });
    await this.render();
  },

  async render() {
    const main = document.getElementById('main');
    main.innerHTML = `<div style="text-align:center; padding:60px;"><span class="loading"></span> 読込中...</div>`;
    try {
      const html = await Views[this.currentView]();
      main.innerHTML = html;
      const initFn = ({
        import: ImportView, payments: PaymentsView, register: RegisterView,
        qr: QRView, pdf: PDFView, match: MatchView, export: ExportView, reports: ReportView
      })[this.currentView];
      if (initFn && initFn.init) await initFn.init();
    } catch (e) {
      main.innerHTML = `<div class="panel"><div class="panel-body" style="color:var(--error);"><strong>エラー:</strong> ${escHTML(e.message)}</div></div>`;
      notify(e.message, 'error');
    }
  }
};

// ====================================================================
// CSV取込ビュー
// ====================================================================
const ImportView = {
  pendingFile: null,

  init() {
    const drop = document.getElementById('csv-drop');
    const input = document.getElementById('csv-file-input');
    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('drag-over');
      this.handleFiles(e.dataTransfer.files);
    });
    input.addEventListener('change', e => this.handleFiles(e.target.files));
  },

  async handleFiles(files) {
    if (!files.length) return;
    const file = files[0];
    this.pendingFile = file;
    notify('CSVを解析中...', 'info');
    try {
      const result = await API.csv.preview(file);
      this.showPreview(result);
    } catch (e) {
      notify('解析失敗: ' + e.message, 'error');
    }
  },

  showPreview(result) {
    const panel = document.getElementById('csv-preview');
    const body = document.getElementById('csv-preview-body');
    panel.style.display = 'block';
    body.innerHTML = `
      <p class="text-sm text-muted mb-3">
        ファイル: <strong>${escHTML(result.filename)}</strong> ／ 
        エンコーディング: <strong>${result.encoding}</strong> ／ 
        <strong>${result.row_count}件</strong>のデータ
      </p>
      <div class="table-wrapper" style="border:none; max-height:300px;">
        <table class="data-table">
          <thead><tr>${result.headers.map(h => `<th>${escHTML(h)}</th>`).join('')}</tr></thead>
          <tbody>
            ${result.preview.map(r => `<tr>${result.headers.map(h => `<td>${escHTML(r[h])}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${result.row_count > result.preview.length ? `<p class="text-sm text-muted mt-3">…他 ${result.row_count - result.preview.length}件</p>` : ''}
    `;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  async commit() {
    if (!this.pendingFile) return;
    try {
      const result = await API.csv.import(this.pendingFile, {
        default_route: document.getElementById('import-route-default').value,
        default_dispatch: document.getElementById('import-dispatch-default').value,
        default_date: document.getElementById('import-date').value
      });
      notify(`${result.success}件取込成功 / ${result.error}件エラー`, result.error ? 'warning' : 'success');
      this.pendingFile = null;
      document.getElementById('csv-preview').style.display = 'none';
      setTimeout(() => App.navigate('payments'), 600);
    } catch (e) {
      notify('取込失敗: ' + e.message, 'error');
    }
  },

  cancel() {
    this.pendingFile = null;
    document.getElementById('csv-preview').style.display = 'none';
  }
};

// ====================================================================
// 入金明細ビュー
// ====================================================================
const PaymentsView = {
  async init() { await this.refresh(); },

  buildParams() {
    const p = {};
    const q = document.getElementById('filter-q')?.value;
    const route = document.getElementById('filter-route')?.value;
    const dispatch = document.getElementById('filter-dispatch')?.value;
    const matched = document.getElementById('filter-match')?.value;
    const from = document.getElementById('filter-from')?.value;
    const to = document.getElementById('filter-to')?.value;
    if (q) p.q = q;
    if (route) p.route = route;
    if (dispatch) p.dispatch = dispatch;
    if (matched) p.matched = matched;
    if (from) p.from = from;
    if (to) p.to = to;
    return p;
  },

  async refresh() {
    const params = this.buildParams();
    try {
      const result = await API.payments.list(params);
      App.currentPayments = result.data;
      const tbody = document.getElementById('payments-tbody');
      const subtitle = document.getElementById('payments-subtitle');
      const total = result.data.reduce((s, p) => s + p.amount, 0);
      subtitle.textContent = `${result.data.length}件 / 全${result.total}件 ／ ${yen(total)}`;

      if (!result.data.length) {
        tbody.innerHTML = `<tr><td colspan="11" class="empty-state"><div class="empty-text">該当する入金がありません</div></td></tr>`;
        return;
      }
      tbody.innerHTML = result.data.map(p => `
        <tr class="${p.matched ? 'matched' : ''}">
          <td class="font-mono text-sm">${p.id}</td>
          <td class="font-mono">${p.payment_date}</td>
          <td>${escHTML(p.name_kana)}</td>
          <td>${escHTML(p.name_kanji || '')}</td>
          <td><span class="badge ${ROUTES[p.route].cls}">${ROUTES[p.route].label}</span></td>
          <td>${escHTML(p.dispatch_type || '')}</td>
          <td class="num">${yen(p.amount)}</td>
          <td class="text-sm">${escHTML(p.commercial || '')}</td>
          <td class="text-sm">${p.pdf_filename ? '<span style="color:var(--accent);">⎙</span> ' + escHTML(p.pdf_filename) : '<span class="text-muted">-</span>'}</td>
          <td class="center">${p.matched ? '<span class="badge badge-success">突合済</span>' : '<span class="badge badge-warning">未突合</span>'}</td>
          <td class="center">
            <button class="btn btn-sm" onclick="PaymentsView.edit(${p.id})">編集</button>
            <button class="btn btn-sm btn-danger" onclick="PaymentsView.del(${p.id})">削除</button>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      notify('取得失敗: ' + e.message, 'error');
    }
  },

  async edit(id) {
    const p = await API.payments.get(id);
    Modal.open({
      title: `入金編集: ID ${p.id}`,
      body: `
        <div class="form-grid">
          <div class="form-group"><label class="form-label">取扱日</label><input type="date" class="form-input" id="ep-date" value="${p.payment_date}"></div>
          <div class="form-group"><label class="form-label">経路</label><select class="form-select" id="ep-route">${Object.entries(ROUTES).map(([k,r])=>`<option value="${k}" ${p.route===k?'selected':''}>${r.label}</option>`).join('')}</select></div>
          <div class="form-group"><label class="form-label">発送種別</label><select class="form-select" id="ep-dispatch">${DISPATCH_TYPES.map(d=>`<option ${p.dispatch_type===d?'selected':''}>${d}</option>`).join('')}</select></div>
          <div class="form-group"><label class="form-label">氏名カナ</label><input type="text" class="form-input" id="ep-name" value="${escHTML(p.name_kana)}"></div>
          <div class="form-group"><label class="form-label">氏名漢字</label><input type="text" class="form-input" id="ep-kanji" value="${escHTML(p.name_kanji||'')}"></div>
          <div class="form-group"><label class="form-label">金額</label><input type="number" class="form-input" id="ep-amount" value="${p.amount}"></div>
          <div class="form-group"><label class="form-label">コマーシャル</label><input type="text" class="form-input" id="ep-commercial" value="${escHTML(p.commercial||'')}"></div>
        </div>
        <div class="form-group" style="margin-top:14px;"><label class="form-label">メモ</label><textarea class="form-textarea" id="ep-note">${escHTML(p.note||'')}</textarea></div>
        <label style="display:flex; align-items:center; gap:6px; margin-top:14px;">
          <input type="checkbox" id="ep-matched" ${p.matched?'checked':''}> 突合済とする
        </label>
      `,
      onConfirm: async () => {
        try {
          await API.payments.update(id, {
            payment_date: document.getElementById('ep-date').value,
            route: document.getElementById('ep-route').value,
            dispatch_type: document.getElementById('ep-dispatch').value,
            name_kana: document.getElementById('ep-name').value,
            name_kanji: document.getElementById('ep-kanji').value,
            amount: parseInt(document.getElementById('ep-amount').value) || 0,
            commercial: document.getElementById('ep-commercial').value,
            note: document.getElementById('ep-note').value,
            matched: document.getElementById('ep-matched').checked
          });
          notify('更新しました', 'success');
          this.refresh();
        } catch (e) {
          notify('更新失敗: ' + e.message, 'error');
        }
      }
    });
  },

  async del(id) {
    if (!confirm(`入金 ID ${id} を削除しますか？`)) return;
    try {
      await API.payments.delete(id);
      notify('削除しました', 'success');
      this.refresh();
    } catch (e) {
      notify('削除失敗: ' + e.message, 'error');
    }
  },

  exportFiltered() {
    const params = this.buildParams();
    downloadUrl(API.csv.exportUrl(params));
    notify('CSVダウンロード中...', 'success');
  }
};

// ====================================================================
// 個別登録ビュー
// ====================================================================
const RegisterView = {
  init() {},
  reset() {
    ['reg-name','reg-name-kanji','reg-amount','reg-account','reg-commercial','reg-note'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
  },
  async submit() {
    const name = document.getElementById('reg-name').value.trim();
    const amount = parseInt(document.getElementById('reg-amount').value) || 0;
    const date = document.getElementById('reg-date').value;
    if (!name || !amount || !date) {
      notify('氏名カナ・金額・取扱日は必須です', 'warning');
      return;
    }
    try {
      await API.payments.create({
        payment_date: date,
        name_kana: name,
        name_kanji: document.getElementById('reg-name-kanji').value,
        amount,
        route: document.getElementById('reg-route').value,
        dispatch_type: document.getElementById('reg-dispatch').value,
        account_no: document.getElementById('reg-account').value,
        commercial: document.getElementById('reg-commercial').value,
        note: document.getElementById('reg-note').value,
        source: 'manual'
      });
      notify('入金を登録しました', 'success');
      setTimeout(() => App.navigate('payments'), 500);
    } catch (e) {
      notify('登録失敗: ' + e.message, 'error');
    }
  }
};

// ====================================================================
// QRビュー
// ====================================================================
const QRView = {
  scanner: null,
  init() {},

  start() {
    if (typeof Html5Qrcode === 'undefined') { notify('QRリーダー読込失敗', 'error'); return; }
    if (this.scanner) this.stop();
    document.getElementById('qr-start-btn').style.display = 'none';
    document.getElementById('qr-stop-btn').style.display = 'inline-flex';
    this.scanner = new Html5Qrcode('qr-reader');
    this.scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      decoded => this.onDecoded(decoded),
      () => {}
    ).catch(err => {
      notify('カメラ起動失敗: ' + err, 'error');
      document.getElementById('qr-start-btn').style.display = 'inline-flex';
      document.getElementById('qr-stop-btn').style.display = 'none';
    });
  },

  async stop() {
    if (this.scanner) {
      try { await this.scanner.stop(); } catch (e) {}
      this.scanner = null;
    }
    document.getElementById('qr-start-btn').style.display = 'inline-flex';
    document.getElementById('qr-stop-btn').style.display = 'none';
  },

  scanFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const scanner = new Html5Qrcode('qr-reader');
    scanner.scanFile(file, true)
      .then(decoded => this.onDecoded(decoded))
      .catch(err => notify('読取失敗: ' + err, 'error'));
  },

  async onDecoded(text) {
    document.getElementById('qr-result').innerHTML = `
      <div class="panel" style="margin:0;">
        <div class="panel-header"><div class="panel-title">読取結果</div></div>
        <div class="panel-body"><pre style="font-family:'JetBrains Mono', monospace; font-size:12px; white-space:pre-wrap; word-break:break-all;">${escHTML(text)}</pre></div>
      </div>`;
    try {
      const parsed = await API.qr.parse(text);
      this.fillForm(parsed.normalized);
      notify('QRコードを読み取りました', 'success');
    } catch (e) {
      notify('解析失敗: ' + e.message, 'error');
    }
    this.stop();
  },

  fillForm(d) {
    if (d.payer_kana) document.getElementById('qr-name').value = d.payer_kana;
    if (d.amount) document.getElementById('qr-amount').value = d.amount;
    if (d.commercial) document.getElementById('qr-commercial').value = d.commercial;
    if (d.date) document.getElementById('qr-date').value = d.date;
  },

  async fillSample() {
    const sample = JSON.stringify({
      payee: '団体名', account: '00120-1-234567',
      amount: 15000, payer_kana: 'ヤマダ タロウ',
      commercial: 'A1024', date: '20260428'
    });
    await this.onDecoded(sample);
  },

  async register() {
    const name = document.getElementById('qr-name').value.trim();
    const amount = parseInt(document.getElementById('qr-amount').value) || 0;
    if (!name || !amount) { notify('氏名カナ・金額は必須です', 'warning'); return; }
    try {
      await API.qr.register({
        payer_kana: name,
        amount,
        date: document.getElementById('qr-date').value,
        commercial: document.getElementById('qr-commercial').value,
        dispatch_type: document.getElementById('qr-dispatch').value
      });
      notify('QR読取データを登録しました', 'success');
      setTimeout(() => App.navigate('payments'), 500);
    } catch (e) {
      notify('登録失敗: ' + e.message, 'error');
    }
  }
};

// ====================================================================
// PDFビュー
// ====================================================================
const PDFView = {
  async init() {
    const drop = document.getElementById('pdf-drop');
    const input = document.getElementById('pdf-file-input');
    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('drag-over');
      this.upload(e.dataTransfer.files);
    });
    input.addEventListener('change', e => this.upload(e.target.files));
    await this.refresh();
  },

  async upload(files) {
    if (!files.length) return;
    const prefix = document.getElementById('pdf-prefix').value;
    notify(`${files.length}個のPDFをアップロード&分割中...`, 'info');
    try {
      const result = await API.pdf.upload(files, prefix);
      notify(`${result.count}ページに分割しました`, 'success');
      await this.refresh();
    } catch (e) {
      notify('処理失敗: ' + e.message, 'error');
    }
  },

  async refresh() {
    try {
      const result = await API.pdf.list();
      const list = document.getElementById('pdf-list');
      const count = document.getElementById('pdf-count');
      count.textContent = `（${result.data.length}件）`;
      if (!result.data.length) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">⎙</div><div class="empty-text">PDFがありません</div></div>';
        return;
      }
      list.innerHTML = result.data.map(pdf => `
        <div class="pdf-item">
          <div class="pdf-item-icon">PDF</div>
          <div class="pdf-item-info">
            <div class="pdf-item-name">
              <input type="text" value="${escHTML(pdf.filename)}" data-id="${pdf.id}"
                onchange="PDFView.rename(${pdf.id}, this.value)"
                style="border:none; background:transparent; width:100%; font-family:inherit; font-size:13px; font-weight:500; padding:2px 4px; border-bottom:1px dashed var(--border);">
            </div>
            <div class="pdf-item-meta">
              元: ${escHTML(pdf.original_name || '-')} ／ p${pdf.page_no}/${pdf.total_pages} ／ ${(pdf.size_bytes/1024).toFixed(1)} KB
              ${pdf.linked ? '<span class="badge badge-success" style="margin-left:8px; font-size:9px;">紐付済</span>' : ''}
            </div>
          </div>
          <a class="btn btn-sm" href="/api/pdf/${pdf.id}/download" download>↧ DL</a>
          <button class="btn btn-sm btn-danger" onclick="PDFView.delete(${pdf.id})">削除</button>
        </div>
      `).join('');
    } catch (e) {
      notify('取得失敗: ' + e.message, 'error');
    }
  },

  async rename(id, filename) {
    try {
      await API.pdf.rename(id, filename);
      notify('リネームしました', 'success');
    } catch (e) {
      notify('リネーム失敗: ' + e.message, 'error');
    }
  },

  async delete(id) {
    if (!confirm('このPDFを削除しますか？')) return;
    try {
      await API.pdf.delete(id);
      notify('削除しました', 'success');
      await this.refresh();
    } catch (e) {
      notify('削除失敗: ' + e.message, 'error');
    }
  }
};

// ====================================================================
// 突合ビュー
// ====================================================================
const MatchView = {
  selectedPaymentId: null,

  async init() { await this.refresh(); },

  async refresh() {
    try {
      const [paymentsRes, pdfsRes] = await Promise.all([
        API.payments.list({ matched: 'unmatched' }),
        API.pdf.list()
      ]);
      const allPayments = await API.payments.list();
      const matchedCount = allPayments.data.filter(p => p.matched).length;
      const unmatchedCount = paymentsRes.data.length;
      const unlinkedPdfs = pdfsRes.data.filter(p => !p.linked).length;

      document.getElementById('match-stats').innerHTML = `
        <div class="stat-card"><div class="stat-label">突合済</div><div class="stat-value">${matchedCount}<span class="stat-suffix">件</span></div></div>
        <div class="stat-card warning"><div class="stat-label">未突合 入金</div><div class="stat-value">${unmatchedCount}<span class="stat-suffix">件</span></div></div>
        <div class="stat-card accent"><div class="stat-label">未紐付PDF</div><div class="stat-value">${unlinkedPdfs}<span class="stat-suffix">件</span></div></div>
      `;

      document.getElementById('match-payment-count').textContent = `${unmatchedCount}件`;
      const pl = document.getElementById('match-payments-list');
      if (!paymentsRes.data.length) {
        pl.innerHTML = '<div class="empty-state"><div class="empty-icon">✓</div><div class="empty-text">未突合の入金はありません</div></div>';
      } else {
        pl.innerHTML = paymentsRes.data.map(p => `
          <div class="match-item ${this.selectedPaymentId === p.id ? 'selected' : ''}" data-id="${p.id}" onclick="MatchView.selectPayment(${p.id})">
            <div class="match-info">
              <div class="match-name">${escHTML(p.name_kanji || p.name_kana)}</div>
              <div class="match-meta">${p.payment_date} ／ <span class="badge ${ROUTES[p.route].cls}" style="font-size:9px; padding:1px 4px;">${ROUTES[p.route].label}</span></div>
            </div>
            <div class="match-amount">${yen(p.amount)}</div>
          </div>
        `).join('');
      }

      document.getElementById('match-pdf-count').textContent = `${pdfsRes.data.length}件`;
      const pdfList = document.getElementById('match-pdfs-list');
      if (!pdfsRes.data.length) {
        pdfList.innerHTML = `<div class="empty-state"><div class="empty-icon">⎙</div><div class="empty-text">PDFがアップロードされていません<br><a href="#" onclick="App.navigate('pdf'); return false;" style="color:var(--accent);">PDF分割画面でアップロード →</a></div></div>`;
      } else {
        pdfList.innerHTML = pdfsRes.data.map(pdf => `
          <div class="match-item ${pdf.linked ? 'matched' : ''}" data-id="${pdf.id}" onclick="MatchView.linkPDF(${pdf.id})">
            <div class="match-info">
              <div class="match-name">${escHTML(pdf.filename)}</div>
              <div class="match-meta">${pdf.linked ? '<span class="badge badge-success" style="font-size:9px; padding:1px 4px;">紐付済</span>' : 'クリックで選択中の入金に紐付け'}</div>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      notify('取得失敗: ' + e.message, 'error');
    }
  },

  selectPayment(id) {
    this.selectedPaymentId = id;
    document.querySelectorAll('#match-payments-list .match-item').forEach(el => {
      el.classList.toggle('selected', Number(el.dataset.id) === id);
    });
    notify('入金を選択しました。右側のPDFをクリックで紐付け', 'info');
  },

  async linkPDF(pdfId) {
    if (!this.selectedPaymentId) {
      notify('先に左側の入金を選択してください', 'warning');
      return;
    }
    try {
      await API.pdf.link(pdfId, this.selectedPaymentId);
      notify('紐付けました', 'success');
      this.selectedPaymentId = null;
      await this.refresh();
    } catch (e) {
      notify('紐付け失敗: ' + e.message, 'error');
    }
  },

  async autoMatch() {
    try {
      const result = await API.payments.autoMatch();
      notify(result.matched > 0 ? `${result.matched}件を自動マッチング` : '一致候補なし', result.matched > 0 ? 'success' : 'warning');
      await this.refresh();
    } catch (e) {
      notify('自動マッチング失敗: ' + e.message, 'error');
    }
  }
};

// ====================================================================
// CSV出力ビュー
// ====================================================================
const ExportView = {
  init() {},

  buildParams() {
    const p = {};
    const from = document.getElementById('exp-from').value;
    const to = document.getElementById('exp-to').value;
    const route = document.getElementById('exp-route').value;
    const matched = document.getElementById('exp-match').value;
    if (from) p.from = from;
    if (to) p.to = to;
    if (route) p.route = route;
    if (matched) p.matched = matched;
    const cols = Array.from(document.querySelectorAll('input[name="exp-col"]:checked')).map(el => el.value);
    if (cols.length) p.columns = cols.join(',');
    return p;
  },

  async preview() {
    const params = this.buildParams();
    try {
      const result = await API.payments.list(params);
      const cols = (params.columns || '').split(',').filter(Boolean);
      const allCols = {
        id: 'ID', payment_date: '取扱日', name_kana: '氏名カナ', name_kanji: '氏名漢字',
        amount: '金額', route: '経路', dispatch_type: '発送種別', account_no: '口座番号',
        commercial: 'コマーシャル', matched: '突合状態', pdf_filename: 'PDFファイル名',
        note: 'メモ', source: '取込元', created_at: '登録日時'
      };
      const panel = document.getElementById('exp-preview-panel');
      panel.style.display = 'block';
      document.getElementById('exp-preview-count').textContent = `${result.data.length}件`;
      const tbl = document.getElementById('exp-preview-table');
      tbl.innerHTML = `
        <thead><tr>${cols.map(c => `<th>${allCols[c] || c}</th>`).join('')}</tr></thead>
        <tbody>
          ${result.data.slice(0, 100).map(r => `<tr>${cols.map(c => {
            let v = r[c];
            if (c === 'route') v = ROUTES[r.route].label;
            if (c === 'matched') v = r.matched ? '突合済' : '未突合';
            return `<td>${escHTML(v ?? '')}</td>`;
          }).join('')}</tr>`).join('')}
        </tbody>
      `;
      panel.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      notify('プレビュー失敗: ' + e.message, 'error');
    }
  },

  download() {
    const params = this.buildParams();
    downloadUrl(API.csv.exportUrl(params));
    notify('CSVダウンロード開始', 'success');
  }
};

// ====================================================================
// 帳票ビュー
// ====================================================================
const ReportView = {
  init() {},

  async show(type) {
    const from = document.getElementById('rep-from').value;
    const to = document.getElementById('rep-to').value;
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const out = document.getElementById('report-output');
    out.innerHTML = `<div style="text-align:center; padding:40px;"><span class="loading"></span> 集計中...</div>`;

    try {
      if (type === 'summary') {
        const data = await API.reports.summary(params);
        out.innerHTML = this.renderSummary(data, params);
      } else {
        const data = await API.reports.detail(params);
        out.innerHTML = this.renderDetail(data, params);
      }
      out.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      notify('帳票生成失敗: ' + e.message, 'error');
    }
  },

  renderSummary(data, params) {
    const csvUrl = API.reports.summaryCsvUrl(params);
    return `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">入金集計表</div>
          <div>
            <button class="btn btn-sm" onclick="window.print()">⎙ 印刷</button>
            <a class="btn btn-sm" href="${csvUrl}" download>↧ CSV</a>
          </div>
        </div>
        <div class="panel-body">
          <div style="text-align:center; margin-bottom:20px;">
            <h2 style="font-family:'Noto Serif JP', serif; font-size:22px; font-weight:700;">入 金 集 計 表</h2>
            <div class="text-sm text-muted" style="margin-top:6px;">期間: ${data.from || '指定なし'} 〜 ${data.to || '指定なし'} ／ 出力日: ${new Date().toLocaleDateString('ja-JP')}</div>
          </div>

          <table class="data-table">
            <thead><tr><th>振込経路</th><th>発送種別</th><th class="num">件数</th><th class="num">金額</th><th class="num">構成比</th></tr></thead>
            <tbody>
              ${data.byRoute.map(r => {
                const dispatches = data.byDispatch.filter(d => d.route === r.route);
                const pct = data.total.amount > 0 ? ((r.amount / data.total.amount) * 100).toFixed(1) : 0;
                return `
                  <tr style="background:var(--bg-tertiary); font-weight:600;">
                    <td><span class="badge ${ROUTES[r.route].cls}">${ROUTES[r.route].label}</span></td>
                    <td><strong>小計</strong></td>
                    <td class="num">${r.count}</td>
                    <td class="num">${yen(r.amount)}</td>
                    <td class="num">${pct}%</td>
                  </tr>
                  ${dispatches.map(d => {
                    const dpct = data.total.amount > 0 ? ((d.amount / data.total.amount) * 100).toFixed(1) : 0;
                    return `
                      <tr>
                        <td></td>
                        <td style="padding-left:24px;">└ ${escHTML(d.dispatch_type)}</td>
                        <td class="num">${d.count}</td>
                        <td class="num">${yen(d.amount)}</td>
                        <td class="num">${dpct}%</td>
                      </tr>`;
                  }).join('')}
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background:var(--bg-dark); color:#f5f3ee; font-weight:700;">
                <td colspan="2">合 計</td>
                <td class="num">${data.total.count}</td>
                <td class="num">${yen(data.total.amount)}</td>
                <td class="num">100.0%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  },

  renderDetail(data, params) {
    const csvUrl = API.reports.detailCsvUrl(params);
    const total = data.rows.reduce((s, r) => s + r.amount, 0);
    return `
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">入金明細表</div>
          <div>
            <button class="btn btn-sm" onclick="window.print()">⎙ 印刷</button>
            <a class="btn btn-sm" href="${csvUrl}" download>↧ CSV</a>
          </div>
        </div>
        <div class="panel-body">
          <div style="text-align:center; margin-bottom:20px;">
            <h2 style="font-family:'Noto Serif JP', serif; font-size:22px; font-weight:700;">入 金 明 細 表</h2>
            <div class="text-sm text-muted" style="margin-top:6px;">期間: ${data.from || '指定なし'} 〜 ${data.to || '指定なし'} ／ ${data.rows.length}件 ／ 合計 ${yen(total)}</div>
          </div>

          <table class="data-table">
            <thead><tr>
              <th>取扱日</th><th>氏名カナ</th><th>氏名</th><th>経路</th><th>発送種別</th>
              <th class="num">金額</th><th>コマーシャル</th><th class="center">突合</th>
            </tr></thead>
            <tbody>
              ${data.rows.length === 0 ? '<tr><td colspan="8" class="empty-state">対象データがありません</td></tr>' :
                data.rows.map(p => `
                  <tr>
                    <td class="font-mono">${p.payment_date}</td>
                    <td>${escHTML(p.name_kana)}</td>
                    <td>${escHTML(p.name_kanji || '')}</td>
                    <td><span class="badge ${ROUTES[p.route].cls}">${ROUTES[p.route].label}</span></td>
                    <td>${escHTML(p.dispatch_type || '')}</td>
                    <td class="num">${yen(p.amount)}</td>
                    <td class="text-sm">${escHTML(p.commercial || '')}</td>
                    <td class="center">${p.matched ? '○' : '−'}</td>
                  </tr>`).join('')}
            </tbody>
            <tfoot>
              <tr style="background:var(--bg-dark); color:#f5f3ee; font-weight:700;">
                <td colspan="5">合 計</td>
                <td class="num">${yen(total)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  }
};

// ====================================================================
// モーダル
// ====================================================================
const Modal = {
  open({ title, body, onConfirm, large = false }) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this) Modal.close()">
        <div class="modal ${large ? 'modal-large' : ''}">
          <div class="modal-header">
            <div class="modal-title">${title}</div>
            <button class="modal-close" onclick="Modal.close()">×</button>
          </div>
          <div class="modal-body">${body}</div>
          <div class="modal-footer">
            <button class="btn" onclick="Modal.close()">キャンセル</button>
            <button class="btn btn-accent" id="modal-confirm">OK</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('modal-confirm').onclick = async () => {
      try { await (onConfirm && onConfirm()); } finally { Modal.close(); }
    };
  },
  close() { document.getElementById('modal-root').innerHTML = ''; }
};

// 起動
document.addEventListener('DOMContentLoaded', () => App.init());
