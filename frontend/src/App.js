import { useState, useCallback } from "react";
import axios from "axios";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #000;
    color: #e8e8e8;
    font-family: 'IBM Plex Sans', sans-serif;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .app { min-height: 100vh; background: #000; position: relative; }

.corner {
  position: fixed;
  width: 50px;
  height: 50px;
  pointer-events: none;
  z-index: 999;
}
.corner-tl { top: 24px; left: 24px; border-top: 1px solid #FFB800; border-left: 1px solid #FFB800; }
.corner-tr { top: 24px; right: 24px; border-top: 1px solid #FFB800; border-right: 1px solid #FFB800; }
.corner-bl { bottom: 24px; left: 24px; border-bottom: 1px solid #FFB800; border-left: 1px solid #FFB800; }
.corner-br { bottom: 24px; right: 24px; border-bottom: 1px solid #FFB800; border-right: 1px solid #FFB800; } 

  .main {
    max-width: 780px;
    margin: 0 auto;
    padding: 52px 28px 80px;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 72px;
  }

  .logo {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    letter-spacing: 0.08em;
  }

  .logo span { color: #FFB800; }

  .status {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #444;
    letter-spacing: 0.1em;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #FFB800;
    animation: blink 2.5s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
  }

  .hero { margin-bottom: 60px; }

  .hero-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.2em;
    color: #333;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .hero h1 {
    font-size: clamp(36px, 6vw, 60px);
    font-weight: 300;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: #fff;
    margin-bottom: 6px;
  }

  .hero h1 strong {
    font-weight: 600;
    color: #FFB800;
  }

  .hero-desc {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #333;
    letter-spacing: 0.04em;
    margin-top: 16px;
  }

  .drop-area {
    border: 1px solid #1a1a1a;
    padding: 52px 28px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    background: #050505;
    margin-bottom: 10px;
  }

  .drop-area:hover, .drop-area.over {
    border-color: #2a2a2a;
    background: #080808;
  }

  .drop-arrow {
    font-size: 22px;
    color: #222;
    margin-bottom: 14px;
  }

  .drop-title {
    font-size: 14px;
    font-weight: 500;
    color: #555;
    margin-bottom: 5px;
  }

  .drop-hint {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #252525;
    letter-spacing: 0.06em;
  }

  .file-ready { display: flex; flex-direction: column; align-items: center; gap: 5px; }

  .file-name {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    color: #FFB800;
    font-weight: 500;
  }

  .file-meta {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #2a2a2a;
    letter-spacing: 0.05em;
  }

  .actions {
    display: flex;
    gap: 8px;
    margin-bottom: 40px;
  }

  .btn-run {
    flex: 1;
    padding: 13px 20px;
    background: #FFB800;
    border: none;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #000;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
  }

  .btn-run:hover:not(:disabled) { background: #ffc933; }
  .btn-run:disabled { background: #111; color: #333; cursor: not-allowed; }

  .btn-clr {
    padding: 13px 16px;
    background: transparent;
    border: 1px solid #1a1a1a;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #333;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.06em;
  }

  .btn-clr:hover { border-color: #333; color: #666; }

  .scanning {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #FFB800;
    letter-spacing: 0.1em;
    animation: fade 1s ease-in-out infinite alternate;
    margin-bottom: 20px;
  }

  @keyframes fade { from { opacity: 0.3; } to { opacity: 0.9; } }

  .err {
    border-left: 2px solid #FFB800;
    padding: 10px 14px;
    margin-bottom: 24px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #FFB800;
    background: #0a0800;
    letter-spacing: 0.03em;
  }

  .sep {
    border: none;
    border-top: 1px solid #111;
    margin-bottom: 36px;
  }

  .res-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 28px;
  }

  .res-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    color: #333;
    text-transform: uppercase;
  }

  .res-fname {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #222;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: #111;
    margin-bottom: 40px;
  }

  .stat {
    background: #000;
    padding: 24px 20px;
  }

  .stat-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #333;
    margin-bottom: 10px;
  }

  .stat-val {
    font-size: 44px;
    font-weight: 300;
    line-height: 1;
    color: #fff;
  }

  .stat-val.amber { color: #FFB800; }
  .stat-val.white { color: #fff; }

  .threats-hd {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #333;
    margin-bottom: 12px;
  }

  .flows { display: flex; flex-direction: column; gap: 3px; }

  .flow-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: #050505;
    border-left: 2px solid #1a1500;
    transition: border-color 0.12s;
  }

  .flow-row:hover { border-color: #FFB800; }

  .flow-left { display: flex; align-items: center; gap: 16px; }

  .flow-id {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #252525;
    min-width: 64px;
  }

  .atk {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    padding: 3px 9px;
    background: #0d0900;
    border: 1px solid #2a1f00;
    color: #FFB800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .conf-val {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #252525;
  }

  .conf-val b { color: #444; font-weight: 500; }

  .more-rows {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #222;
    text-align: center;
    padding: 12px;
    letter-spacing: 0.06em;
  }

  .clear-state {
    padding: 40px 28px;
    border: 1px solid #111;
    background: #030303;
  }

  .clear-title {
    font-size: 28px;
    font-weight: 300;
    color: #fff;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
  }

  .clear-title strong { font-weight: 600; }

  .clear-sub {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #252525;
    letter-spacing: 0.08em;
  }
`;

export default function App() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [over, setOver] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (ext !== "csv" && ext !== "pcap") { setError("Only .csv and .pcap files are accepted"); return; }
    setFile(f); setFileType(ext); setResults(null); setError(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const clear = () => { setFile(null); setFileType(null); setResults(null); setError(null); };

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResults(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const ep = fileType === "csv" ? "/analyze/csv" : "/analyze/pcap";
      const res = await axios.post(`http://127.0.0.1:8000${ep}`, fd);
      setResults(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Analysis failed — is the backend running?");
    } finally { setLoading(false); }
  };

  const attacks = results?.results?.filter(r => r.verdict === "Attack") || [];
  const normals = results?.results?.filter(r => r.verdict === "Normal") || [];

  return (
    <>
      <style>{S}</style>
      <div className="app">
  <div className="corner corner-tl" />
  <div className="corner corner-tr" />
  <div className="corner corner-bl" />
  <div className="corner corner-br" />
  <div className="main">

          <div className="topbar">
            <div className="logo">SENTINEL<span>.DETECT</span></div>
            <div className="status">
              <div className="dot" />
              ACTIVE
            </div>
          </div>

          <div className="hero">
            <div className="hero-label">Network threat detection</div>
            <h1>
              Analyze traffic.<br />
              <strong>Find threats.</strong>
            </h1>
            <p className="hero-desc">Random Forest · binary + 9-class · CSV &amp; PCAP</p>
          </div>

          <input id="fi" type="file" accept=".csv,.pcap"
            style={{display:"none"}}
            onChange={e => handleFile(e.target.files[0])} />

          <div
            className={`drop-area${over ? " over" : ""}`}
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onClick={() => document.getElementById("fi").click()}
          >
            {file ? (
              <div className="file-ready">
                <div className="file-name">{file.name}</div>
                <div className="file-meta">{(file.size/1024).toFixed(1)} KB · .{fileType} · ready</div>
              </div>
            ) : (
              <>
                <div className="drop-arrow">↑</div>
                <div className="drop-title">Drop your capture file</div>
                <div className="drop-hint">or click to browse — .pcap and .csv accepted</div>
              </>
            )}
          </div>

          <div className="actions">
            <button className="btn-run" onClick={analyze} disabled={!file || loading}>
              {loading ? "Scanning..." : "Run Analysis"}
            </button>
            <button className="btn-clr" onClick={clear}>Clear</button>
          </div>

          {loading && <div className="scanning">scanning traffic patterns...</div>}
          {error && <div className="err">{error}</div>}

          {results && (
            <>
              <hr className="sep" />
              <div className="res-top">
                <span className="res-label">Scan results</span>
                <span className="res-fname">{file?.name}</span>
              </div>

              <div className="stats">
                <div className="stat">
                  <div className="stat-label">Total flows</div>
                  <div className="stat-val white">{results.total_flows}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Clean</div>
                  <div className="stat-val white">{results.normal_flows}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Threats</div>
                  <div className="stat-val amber">{results.attacks_found}</div>
                </div>
              </div>

              {attacks.length > 0 ? (
                <>
                  <div className="threats-hd">Detected threats</div>
                  <div className="flows">
                    {attacks.slice(0, 50).map(r => (
                      <div key={r.flow} className="flow-row">
                        <div className="flow-left">
                          <span className="flow-id">flow_{String(r.flow).padStart(4,"0")}</span>
                          <span className="atk">{r.attack_type}</span>
                        </div>
                        <span className="conf-val"><b>{r.confidence}%</b> confidence</span>
                      </div>
                    ))}
                    {attacks.length > 50 && (
                      <div className="more-rows">+{attacks.length - 50} more threats</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="clear-state">
                  <div className="clear-title">All <strong>clear.</strong></div>
                  <div className="clear-sub">{normals.length} flows analyzed · no threats detected</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}