# SmartMeter Anomaly Detector (ML Tool)

An end-to-end anomaly detection tool for **smart meter energy consumption** data.  
Upload a CSV file and the backend runs an **Isolation Forest** model to flag unusual consumption points, then returns:

- **All records** with an `anomaly` boolean label
- **Only anomalous rows** (also saved to `anomalies.csv`)

Includes a lightweight HTML + Chart.js UI for visualization.

## Features

- **ML-based anomaly detection** using `sklearn.ensemble.IsolationForest`
- **Simple API** powered by Flask (`/health`, `/detect`)
- **CSV-in / JSON-out** workflow
- **Visualization UI** (`index.html` + `script.js`) highlighting anomalies

## Expected CSV Format

Your uploaded CSV must contain **both** columns:

- **`timestamp`**: time index (string or numeric; displayed as-is)
- **`consumption`**: meter consumption value (numeric)

Example:

```csv
timestamp,consumption
2026-01-01 00:00:00,1.23
2026-01-01 00:15:00,1.18
```

## Quickstart (Windows / macOS / Linux)

### 1) Create & activate a virtual environment (recommended)

```bash
python -m venv .venv
```

Activate:

- **Windows (PowerShell)**:

```powershell
.\.venv\Scripts\Activate.ps1
```

- **macOS/Linux (bash/zsh)**:

```bash
source .venv/bin/activate
```

### 2) Install dependencies

This project does not currently include a dependency lockfile. Install the required packages with:

```bash
pip install flask flask-cors pandas scikit-learn
```

### 3) Start the backend

```bash
python app.py
```

Backend runs (by default) at `http://localhost:5000`.

### 4) Open the UI

Open `index.html` in your browser (double-click it or “Open with”).

Then upload a CSV in the required format and click **Detect Anomalies**.

## API

### `GET /health`

Returns `"OK"` if the server is running.

### `POST /detect`

Upload a CSV file as `multipart/form-data` under the form field name **`file`**.

- **Response JSON**
  - **`all_data`**: list of `{ timestamp, consumption, anomaly }`
  - **`anomalies`**: list of `{ timestamp, consumption }`
- **Side effect**
  - Writes detected anomalies to `anomalies.csv` in the project root.

Example (curl):

```bash
curl -F "file=@sample_dataset.csv" http://localhost:5000/detect
```

## How it works (ML)

In `model.py`, the pipeline is:

- Read CSV
- Fill missing `consumption` values with the column mean
- Scale `consumption` into `[0, 1]` with `MinMaxScaler`
- Train `IsolationForest` and mark predictions `-1` as anomalies

Model settings (current defaults):

- **Algorithm**: Isolation Forest
- **contamination**: `0.05` (≈5% of points flagged as anomalies)
- **random_state**: `42`

## Project Structure

- `app.py`: Flask API (`/health`, `/detect`) and CORS setup
- `model.py`: training + anomaly detection logic (`train_and_detect`)
- `index.html`: simple UI with file upload + chart canvas
- `script.js`: calls backend, renders Chart.js line chart and anomaly table
- `sample_dataset.csv`: example input format
- `anomalies.csv`: output file generated after running detection
- `trim_dataset.py`: helper script used to create a smaller sample dataset (local-path based)

## Notes / Troubleshooting

- **CORS**: enabled in `app.py` to allow the UI to call `http://localhost:5000` from `index.html`.
- **Large CSV files**: very large uploads may be slow; consider pre-trimming or sampling.
- **Timestamp uniqueness**: the UI highlights anomalies by matching timestamps; duplicate timestamps may cause ambiguous highlighting.

## Roadmap (ideas)

- Add a `requirements.txt` / `pyproject.toml` for reproducible installs
- Make `contamination` configurable from the UI or request parameters
- Add time-based feature engineering (rolling stats, seasonality) for better anomaly quality
- Add unit tests + CI workflow for GitHub

## License

No license file is currently included. If you plan to publish this publicly, consider adding a `LICENSE` (e.g., MIT, Apache-2.0).


