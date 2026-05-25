from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np
from scapy.all import rdpcap, IP, TCP, UDP
import tempfile
import os

app = FastAPI()

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load all saved models
model1   = joblib.load("models/model1_binary.pkl")
model2   = joblib.load("models/model2_multiclass.pkl")
scaler   = joblib.load("models/scaler.pkl")
encoders = joblib.load("models/encoders.pkl")
le_attack = joblib.load("models/le_attack.pkl")

ATTACK_NAMES = le_attack.classes_

# The 42 features our model expects — in exact order
FEATURE_COLS = [
    'dur','proto','service','state','spkts','dpkts','sbytes','dbytes',
    'rate','sttl','dttl','sload','dload','sloss','dloss','sinpkt','dinpkt',
    'sjit','djit','swin','stcpb','dtcpb','dwin','tcprtt','synack','ackdat',
    'smean','dmean','trans_depth','response_body_len','ct_srv_src',
    'ct_state_ttl','ct_dst_ltm','ct_src_dport_ltm','ct_dst_sport_ltm',
    'ct_dst_src_ltm','is_ftp_login','ct_ftp_cmd','ct_flw_http_mthd',
    'ct_src_ltm','ct_srv_dst','is_sm_ips_ports'
]

def preprocess(df):
    """Apply same preprocessing as training"""
    # Keep only the features we need
    df = df[FEATURE_COLS].copy()

    # Encode categorical columns
    cat_cols = ['proto', 'service', 'state']
    for col in cat_cols:
        le = encoders[col]
        # Handle unseen values by replacing with most common
        known = set(le.classes_)
        df[col] = df[col].apply(lambda x: x if x in known else le.classes_[0])
        df[col] = le.transform(df[col])

    # Scale
    df_scaled = scaler.transform(df)
    return df_scaled

def extract_features_from_pcap(filepath):
    """Extract basic flow features from a pcap file"""
    packets = rdpcap(filepath)
    flows = {}

    for pkt in packets:
        if IP not in pkt:
            continue

        # Build flow key (src->dst)
        src = pkt[IP].src
        dst = pkt[IP].dst
        proto = pkt[IP].proto
        sport = pkt[TCP].sport if TCP in pkt else (pkt[UDP].sport if UDP in pkt else 0)
        dport = pkt[TCP].dport if TCP in pkt else (pkt[UDP].dport if UDP in pkt else 0)

        key = (src, dst, sport, dport, proto)

        if key not in flows:
            flows[key] = {
                'proto': 'tcp' if TCP in pkt else ('udp' if UDP in pkt else 'other'),
                'service': '-',
                'state': 'CON',
                'spkts': 0, 'dpkts': 0,
                'sbytes': 0, 'dbytes': 0,
                'times': [], 'lengths': []
            }

        flows[key]['spkts'] += 1
        flows[key]['sbytes'] += len(pkt)
        flows[key]['times'].append(float(pkt.time))
        flows[key]['lengths'].append(len(pkt))

    # Convert flows to feature rows
    rows = []
    for key, f in flows.items():
        times = f['times']
        dur = max(times) - min(times) if len(times) > 1 else 0
        rate = f['spkts'] / dur if dur > 0 else 0
        smean = int(np.mean(f['lengths'])) if f['lengths'] else 0

        row = {col: 0 for col in FEATURE_COLS}  # default all to 0
        row.update({
            'dur': dur,
            'proto': f['proto'],
            'service': f['service'],
            'state': f['state'],
            'spkts': f['spkts'],
            'dpkts': f['dpkts'],
            'sbytes': f['sbytes'],
            'dbytes': f['dbytes'],
            'rate': rate,
            'sttl': 64,
            'smean': smean,
            'dmean': smean,
        })
        rows.append(row)

    return pd.DataFrame(rows)

def predict(df):
    """Run both models and return results"""
    X = preprocess(df)

    # Model 1 — binary
    binary_preds = model1.predict(X)
    binary_probs = model1.predict_proba(X)

    results = []
    for i, (pred, prob) in enumerate(zip(binary_preds, binary_probs)):
        if pred == 0:
            results.append({
                "flow": i + 1,
                "verdict": "Normal",
                "attack_type": None,
                "confidence": round(float(max(prob)) * 100, 1)
            })
        else:
            # Model 2 — attack type
            x_single = X[i:i+1]
            attack_pred = model2.predict(x_single)[0]
            attack_prob = model2.predict_proba(x_single)[0]
            attack_name = ATTACK_NAMES[attack_pred]

            results.append({
                "flow": i + 1,
                "verdict": "Attack",
                "attack_type": attack_name,
                "confidence": round(float(max(attack_prob)) * 100, 1)
            })

    return results

@app.post("/analyze/csv")
async def analyze_csv(file: UploadFile = File(...)):
    contents = await file.read()

    # Save temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        df = pd.read_csv(tmp_path)
        results = predict(df)
        attacks = [r for r in results if r['verdict'] == 'Attack']
        return {
            "total_flows": len(results),
            "attacks_found": len(attacks),
            "normal_flows": len(results) - len(attacks),
            "results": results
        }
    finally:
        os.unlink(tmp_path)

@app.post("/analyze/pcap")
async def analyze_pcap(file: UploadFile = File(...)):
    contents = await file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix='.pcap') as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        df = extract_features_from_pcap(tmp_path)
        if df.empty:
            return {"error": "No valid IP flows found in pcap file"}
        results = predict(df)
        attacks = [r for r in results if r['verdict'] == 'Attack']
        return {
            "total_flows": len(results),
            "attacks_found": len(attacks),
            "normal_flows": len(results) - len(attacks),
            "results": results
        }
    finally:
        os.unlink(tmp_path)

@app.get("/")
def root():
    return {"status": "Malware detector API is running"}