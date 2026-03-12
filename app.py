from flask import Flask, request, jsonify
from model import train_and_detect
import os
from flask_cors import CORS 

app = Flask(__name__)

@app.route('/health')
def health():
    return "OK"

@app.route('/detect', methods=['POST'])
def detect():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return jsonify({'error': 'Please upload a CSV file'}), 400
    file_path = f'tmp_{file.filename}'
    file.save(file_path)
    flagged, cleaned_data = train_and_detect(file_path)
    flagged.to_csv('anomalies.csv', index=False)
    os.remove(file_path)
    response = {
        'all_data': cleaned_data.to_dict(orient='records'),
        'anomalies': flagged.to_dict(orient='records')
    }
    return jsonify(response)

CORS(app)
if __name__ == '__main__':
    app.run(debug=True)
