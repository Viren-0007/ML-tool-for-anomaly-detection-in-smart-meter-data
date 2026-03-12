import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler
import numpy as np

def train_and_detect(csv_file):
    df = pd.read_csv(csv_file)
    if 'timestamp' not in df.columns or 'consumption' not in df.columns:
        raise Exception("CSV needs 'timestamp' and 'consumption' columns")
    df['consumption'] = df['consumption'].fillna(df['consumption'].mean())

    cons_mean = float(df['consumption'].mean())
    cons_std = float(df['consumption'].std(ddof=0))
    cons_median = float(df['consumption'].median())
    eps = 1e-12
    if cons_std < eps:
        cons_std = eps
    if abs(cons_median) < eps:
        cons_median = eps

    scaler = MinMaxScaler()
    df['cons_normalized'] = scaler.fit_transform(df[['consumption']])
    clf = IsolationForest(contamination=0.05, random_state=42)
    preds = clf.fit_predict(df[['cons_normalized']])
    df['anomaly'] = preds == -1

    decision = clf.decision_function(df[['cons_normalized']])
    df['iforest_decision'] = decision
    df['anomaly_score'] = (-decision).astype(float)

    contamination = getattr(clf, "contamination", 0.05) or 0.05
    threshold = float(np.quantile(df['anomaly_score'].to_numpy(), 1 - float(contamination)))
    df['score_threshold'] = threshold

    df['z_score'] = ((df['consumption'] - cons_mean) / cons_std).astype(float)
    df['deviation_pct_from_median'] = (((df['consumption'] - cons_median) / abs(cons_median)) * 100.0).astype(float)

    def _reason(row):
        direction = "above" if row['z_score'] >= 0 else "below"
        return (
            f"IsolationForest score={row['anomaly_score']:.4f} (threshold={threshold:.4f}); "
            f"consumption is {abs(row['z_score']):.2f}σ {direction} mean; "
            f"{row['deviation_pct_from_median']:+.1f}% vs median"
        )

    df['reason'] = df.apply(_reason, axis=1)

    flagged = df[df['anomaly']]

    return (
        flagged[['timestamp', 'consumption', 'anomaly_score', 'z_score', 'deviation_pct_from_median', 'reason']],
        df[['timestamp', 'consumption', 'anomaly', 'anomaly_score', 'z_score', 'deviation_pct_from_median', 'reason']]
    )
