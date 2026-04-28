:root {
  --bg-primary: #f5f3ee;
  --bg-secondary: #ffffff;
  --bg-tertiary: #ebe7df;
  --bg-dark: #1c1c1a;
  --text-primary: #1c1c1a;
  --text-secondary: #5a5953;
  --text-muted: #8a8881;
  --accent: #8b1538;
  --accent-light: #b91d47;
  --accent-soft: #fbe7ee;
  --border: #d6d2c8;
  --border-strong: #1c1c1a;
  --success: #2d5f3f;
  --success-bg: #e3efe6;
  --warning: #8a6d00;
  --warning-bg: #fbf3d6;
  --error: #8b1538;
  --error-bg: #fbe7ee;
  --info: #1e4d72;
  --info-bg: #dde9f2;
  --shadow-sm: 0 1px 2px rgba(28,28,26,0.06);
  --shadow-md: 0 2px 8px rgba(28,28,26,0.08);
  --shadow-lg: 0 8px 24px rgba(28,28,26,0.12);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Noto Sans JP', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
  min-height: 100vh;
  font-feature-settings: "palt";
}

.app {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: var(--bg-dark);
  color: #f5f3ee;
  padding: 24px 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid var(--border);
}

.sidebar-header {
  padding: 0 24px 24px;
  border-bottom: 1px solid rgba(245,243,238,0.1);
  margin-bottom: 16px;
}

.sidebar-logo {
  font-family: 'Noto Serif JP', serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.sidebar-subtitle {
  font-size: 11px;
  color: rgba(245,243,238,0.5);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.sidebar-section { padding: 8px 0; }

.sidebar-section-title {
  padding: 8px 24px;
  font-size: 11px;
  color: rgba(245,243,238,0.4);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 500;
}

.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 24px;
  color: rgba(245,243,238,0.75);
  cursor: pointer; font-size: 13px; font-weight: 400;
  border-left: 2px solid transparent;
  transition: all 0.15s ease;
  user-select: none;
}
.nav-item:hover { background: rgba(245,243,238,0.05); color: #f5f3ee; }
.nav-item.active {
  background: rgba(245,243,238,0.08);
  color: #f5f3ee;
  border-left-color: var(--accent-light);
  font-weight: 500;
}

.nav-icon { width: 16px; height: 16px; display: inline-flex; flex-shrink: 0; }

.main {
  padding: 32px 40px;
  overflow-x: auto;
  max-width: 100%;
}

.page-header {
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border-strong);
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 24px; flex-wrap: wrap;
}

.page-title-group h1 {
  font-family: 'Noto Serif JP', serif;
  font-size: 26px; font-weight: 700;
  letter-spacing: 0.02em; margin-bottom: 4px;
}

.page-subtitle { font-size: 13px; color: var(--text-secondary); letter-spacing: 0.05em; }
.page-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--border-strong);
  background: var(--bg-secondary); color: var(--text-primary);
  font-family: inherit; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s ease;
  border-radius: 0; letter-spacing: 0.02em;
}
.btn:hover { background: var(--bg-tertiary); }
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary { background: var(--bg-dark); color: #f5f3ee; border-color: var(--bg-dark); }
.btn-primary:hover { background: #2c2c28; }
.btn-accent { background: var(--accent); color: #fff; border-color: var(--accent); }
.btn-accent:hover { background: var(--accent-light); }
.btn-sm { padding: 4px 10px; font-size: 12px; }
.btn-icon { padding: 6px 8px; }
.btn-danger { color: var(--error); border-color: var(--error); }
.btn-danger:hover { background: var(--error-bg); }

.panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  margin-bottom: 20px;
}
.panel-header {
  padding: 14px 20px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px;
}
.panel-title { font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
.panel-body { padding: 20px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px; margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  padding: 18px 20px;
  position: relative; overflow: hidden;
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0;
  width: 3px; height: 100%; background: var(--bg-dark);
}
.stat-card.accent::before { background: var(--accent); }
.stat-card.success::before { background: var(--success); }
.stat-card.warning::before { background: var(--warning); }

.stat-label {
  font-size: 11px; color: var(--text-muted);
  letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 6px; font-weight: 500;
}
.stat-value {
  font-family: 'Noto Serif JP', serif;
  font-size: 24px; font-weight: 700; letter-spacing: 0.02em;
}
.stat-suffix {
  font-size: 13px; color: var(--text-secondary);
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 400; margin-left: 4px;
}
.stat-detail { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label {
  font-size: 11px; font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.08em; text-transform: uppercase;
}
.form-input, .form-select, .form-textarea {
  padding: 8px 10px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  font-family: inherit; font-size: 13px;
  color: var(--text-primary); border-radius: 0;
  transition: border 0.15s ease;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none; border-color: var(--bg-dark);
  box-shadow: 0 0 0 1px var(--bg-dark);
}
.form-textarea { resize: vertical; min-height: 60px; }

.table-wrapper { overflow-x: auto; border: 1px solid var(--border); background: var(--bg-secondary); }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table thead { background: var(--bg-tertiary); border-bottom: 2px solid var(--border-strong); }
.data-table th {
  padding: 10px 12px; text-align: left;
  font-weight: 600; font-size: 11px;
  letter-spacing: 0.08em; text-transform: uppercase;
  white-space: nowrap; color: var(--text-secondary);
}
.data-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.data-table tbody tr:hover { background: var(--bg-tertiary); }
.data-table tbody tr.matched { background: var(--success-bg); }
.data-table tbody tr.matched:hover { background: #d4e5d8; }

.num { font-family: 'JetBrains Mono', monospace; text-align: right; font-variant-numeric: tabular-nums; }
.center { text-align: center; }

.badge {
  display: inline-block; padding: 2px 8px;
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  border: 1px solid;
}
.badge-bizf { background: #ede4d8; border-color: #b89e75; color: #6b5230; }
.badge-counter { background: var(--info-bg); border-color: #6f9ec1; color: var(--info); }
.badge-telegram { background: #f0e3ec; border-color: #b07ea0; color: #6b3556; }
.badge-shinou { background: var(--bg-tertiary); border-color: var(--text-muted); color: var(--text-secondary); }
.badge-qr { background: var(--success-bg); border-color: #6fa080; color: var(--success); }
.badge-success { background: var(--success-bg); border-color: var(--success); color: var(--success); }
.badge-warning { background: var(--warning-bg); border-color: var(--warning); color: var(--warning); }
.badge-error { background: var(--error-bg); border-color: var(--error); color: var(--error); }

.dropzone {
  border: 2px dashed var(--border);
  background: var(--bg-tertiary);
  padding: 32px 24px;
  text-align: center; cursor: pointer;
  transition: all 0.15s ease;
}
.dropzone:hover { border-color: var(--bg-dark); background: var(--bg-primary); }
.dropzone.drag-over { border-color: var(--accent); background: var(--accent-soft); }
.dropzone-icon { font-size: 28px; margin-bottom: 8px; color: var(--text-muted); }
.dropzone-text { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.dropzone-hint { font-size: 11px; color: var(--text-muted); }

.toolbar {
  display: flex; align-items: center; gap: 10px;
  flex-wrap: wrap; margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
}
.toolbar-search {
  flex: 1; min-width: 200px;
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  background: var(--bg-tertiary); border: 1px solid var(--border);
}
.toolbar-search input {
  flex: 1; border: none; background: transparent;
  font-family: inherit; font-size: 13px; outline: none;
}

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(28,28,26,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 20px;
}
.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-strong);
  width: 100%; max-width: 600px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
.modal-large { max-width: 900px; }
.modal-header {
  padding: 16px 20px;
  background: var(--bg-dark); color: #f5f3ee;
  display: flex; align-items: center; justify-content: space-between;
}
.modal-title { font-family: 'Noto Serif JP', serif; font-size: 16px; font-weight: 700; }
.modal-close {
  background: transparent; border: none;
  color: #f5f3ee; cursor: pointer;
  font-size: 18px; padding: 0 4px;
}
.modal-body { padding: 20px; }
.modal-footer {
  padding: 14px 20px; background: var(--bg-tertiary);
  border-top: 1px solid var(--border);
  display: flex; justify-content: flex-end; gap: 8px;
}

.notifications {
  position: fixed; bottom: 20px; right: 20px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 200; max-width: 360px;
}
.notification {
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  box-shadow: var(--shadow-md);
  font-size: 13px;
  animation: slideIn 0.2s ease;
}
.notification.success { border-left-color: var(--success); }
.notification.warning { border-left-color: var(--warning); }
.notification.error { border-left-color: var(--error); }
@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.match-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.match-side { background: var(--bg-secondary); border: 1px solid var(--border); }
.match-header {
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.match-side-title { font-size: 13px; font-weight: 600; letter-spacing: 0.05em; }
.match-list { max-height: 480px; overflow-y: auto; }
.match-item {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  cursor: pointer; transition: background 0.15s ease;
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px;
}
.match-item:hover { background: var(--bg-tertiary); }
.match-item.selected { background: var(--accent-soft); border-left: 3px solid var(--accent); }
.match-item.matched { background: var(--success-bg); }
.match-info { flex: 1; min-width: 0; }
.match-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
.match-meta { font-size: 11px; color: var(--text-secondary); }
.match-amount { font-family: 'JetBrains Mono', monospace; font-weight: 500; }

.report-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  padding: 20px;
  text-align: left; cursor: pointer;
  transition: all 0.15s ease;
  display: flex; flex-direction: column; gap: 8px;
}
.report-card:hover { border-color: var(--bg-dark); box-shadow: var(--shadow-md); }
.report-icon {
  width: 36px; height: 36px;
  background: var(--bg-tertiary);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 20px; color: var(--accent);
}
.report-title { font-size: 14px; font-weight: 600; font-family: 'Noto Serif JP', serif; }
.report-desc { font-size: 12px; color: var(--text-secondary); }

.qr-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.qr-reader-box {
  background: var(--bg-tertiary); border: 1px solid var(--border);
  padding: 16px; min-height: 320px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
#qr-reader { width: 100%; max-width: 400px; }

.qr-sample-box { background: var(--bg-secondary); border: 1px solid var(--border); padding: 16px; }
.qr-sample-box h3 {
  font-family: 'Noto Serif JP', serif;
  font-size: 14px; margin-bottom: 12px;
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.qr-sample-img {
  width: 200px; height: 200px;
  background: white; border: 1px solid var(--border);
  margin: 0 auto 12px; display: block;
}
.qr-fields { font-size: 12px; line-height: 1.8; }
.qr-field-row { display: flex; gap: 8px; padding: 4px 0; border-bottom: 1px dashed var(--border); }
.qr-field-key { color: var(--text-muted); min-width: 80px; font-weight: 500; }
.qr-field-val { font-family: 'JetBrains Mono', monospace; color: var(--text-primary); }

.pdf-list { display: flex; flex-direction: column; gap: 8px; max-height: 500px; overflow-y: auto; }
.pdf-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px;
  background: var(--bg-secondary); border: 1px solid var(--border);
}
.pdf-item-icon {
  width: 32px; height: 40px;
  background: var(--error); color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
}
.pdf-item-info { flex: 1; min-width: 0; }
.pdf-item-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; word-break: break-all; }
.pdf-item-meta { font-size: 11px; color: var(--text-muted); }

.empty-state { padding: 48px 24px; text-align: center; color: var(--text-muted); }
.empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.4; }
.empty-text { font-size: 13px; }

.print-only { display: none; }
@media print {
  body { background: white; }
  .sidebar, .page-actions, .toolbar, .panel-header, .btn, .no-print { display: none !important; }
  .app { display: block; }
  .main { padding: 0; }
  .panel { border: none; margin-bottom: 0; page-break-inside: avoid; }
  .data-table { font-size: 11px; }
  .data-table th, .data-table td { padding: 4px 6px; }
}

.flex { display: flex; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.text-muted { color: var(--text-muted); }
.text-sm { font-size: 12px; }
.font-mono { font-family: 'JetBrains Mono', monospace; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mt-3 { margin-top: 12px; }

.section-title {
  font-family: 'Noto Serif JP', serif;
  font-size: 15px; font-weight: 700;
  margin-bottom: 12px; padding-bottom: 6px;
  border-bottom: 1px solid var(--border-strong);
}

.divider-line { height: 1px; background: var(--border); margin: 16px 0; }

.api-list {
  background: var(--bg-dark);
  color: #f5f3ee;
  padding: 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.8;
  border: 1px solid var(--border);
}
.api-list .api-section { color: #d4af37; margin-top: 12px; font-weight: 700; }
.api-list .api-method { color: #6fa080; display: inline-block; min-width: 60px; font-weight: 700; }

.loading {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1024px) {
  .app { grid-template-columns: 1fr; }
  .sidebar { position: relative; height: auto; }
  .match-grid, .qr-section { grid-template-columns: 1fr; }
}
