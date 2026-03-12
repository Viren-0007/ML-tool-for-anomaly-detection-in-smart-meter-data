document.getElementById('upload-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const fileInput = document.getElementById('csvfile');
  if (!fileInput.files.length) return alert('Please select a CSV file.');
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  fetch('http://localhost:5000/detect', {
    method: 'POST',
    body: formData
  })
  .then(r => r.json())
  .then(res => {
    if (res.error) return alert(res.error);
    const data = res.all_data;
    const anomalies = new Set(res.anomalies.map(row => row.timestamp));
    drawChart(data, anomalies);
    showAnomalyTable(res.anomalies);
  })
  .catch(() => alert('Error connecting to backend.'));
});

let chart;
function drawChart(data, anomalies) {
  const ctx = document.getElementById('chart').getContext('2d');
  // Prepare data
  const labels = data.map(r => r.timestamp);
  const consumption = data.map(r => r.consumption);
  // Colors: anomalies in red, others in blue
  const pointColors = data.map(r => anomalies.has(r.timestamp) ? 'red' : 'blue');
  // Destroy previous chart if any
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Consumption',
        data: consumption,
        borderColor: '#5555ee',
        pointBackgroundColor: pointColors,
        pointRadius: 4,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: 'Timestamp' },
          ticks: { autoSkip: true, maxTicksLimit: 14 }
        },
        y: { title: { display: true, text: 'Consumption' } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function showAnomalyTable(anomalies) {
  const table = document.getElementById('anomaly-table');
  if (!anomalies.length) {
    table.innerHTML = '<tr><td>No anomalies detected</td></tr>';
    return;
  }
  table.innerHTML = '<tr><th>Timestamp</th><th>Consumption</th><th>Why (explanation)</th></tr>' +
    anomalies.map(row =>
      `<tr><td>${row.timestamp}</td><td>${row.consumption}</td><td>${row.reason ?? ''}</td></tr>`
    ).join('');
}
