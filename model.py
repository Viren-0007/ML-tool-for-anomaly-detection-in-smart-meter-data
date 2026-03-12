import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler

def train_and_detect(csv_file):
    df = pd.read_csv(csv_file)
    if 'timestamp' not in df.columns or 'consumption' not in df.columns:
        raise Exception("CSV needs 'timestamp' and 'consumption' columns")
    df['consumption'] = df['consumption'].fillna(df['consumption'].mean())
    scaler = MinMaxScaler()
    df['cons_normalized'] = scaler.fit_transform(df[['consumption']])
    clf = IsolationForest(contamination=0.05, random_state=42)
    preds = clf.fit_predict(df[['cons_normalized']])
    df['anomaly'] = preds == -1
    flagged = df[df['anomaly']]
    return flagged[['timestamp', 'consumption']], df[['timestamp', 'consumption', 'anomaly']]