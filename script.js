document.getElementById('upload-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const fileInput = document.getElementById('csvfile');
  if (!fileInput.files.length) return alert('Please select a CSV file.');

  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalText = submitButton ? submitButton.textContent : '';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Analyzing...';
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  fetch('http://localhost:5000/detect', {
    method: 'POST',
    body: formData
  })

  .then(r => r.json())
  .then(res => {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }

    if (res.error) return alert(res.error);
    const data = res.all_data;
    const anomalies = new Set(res.anomalies.map(row => row.timestamp));
    drawChart(data, anomalies);
    showAnomalyTable(res.anomalies);
  })
  .catch(() => {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
    alert('Error connecting to backend.');
  });
}); 
let chart;
function drawChart(data, anomalies) {
  const ctx = document.getElementById('chart').getContext('2d');
  // Prepare data
  const labels = data.map(r => r.timestamp);
  const consumption = data.map(r => r.consumption);
  // Colors & sizes: anomalies in red, others in teal
  const pointColors = data.map(r => anomalies.has(r.timestamp) ? 'rgba(239,68,68,1)' : '#14B8A6');
  const pointRadius = data.map(r => anomalies.has(r.timestamp) ? 5 : 3);
  const pointHoverRadius = data.map(r => anomalies.has(r.timestamp) ? 7 : 5);
  // Destroy previous chart if any
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Consumption',
        data: consumption,
        borderColor: '#14B8A6',
        backgroundColor: 'rgba(20,184,166,0.08)',
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        pointRadius: pointRadius,
        pointHoverRadius: pointHoverRadius,
        borderWidth: 2,
        tension: 0.25,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Timestamp',
            color: '#E5E7EB',
            font: { size: 11, weight: '500' }
          },
          ticks: {
            color: '#9CA3AF',
            maxRotation: 45,
            minRotation: 0
          },
          grid: {
            color: 'rgba(55,65,81,0.6)',
            borderColor: 'rgba(55,65,81,1)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Consumption',
            color: '#E5E7EB',
            font: { size: 11, weight: '500' }
          },
          ticks: {
            color: '#9CA3AF'
          },
          grid: {
            color: 'rgba(31,41,55,0.7)',
            borderColor: 'rgba(55,65,81,1)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          titleColor: '#F9FAFB',
          bodyColor: '#E5E7EB',
          borderColor: '#14B8A6',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            label: function(context) {
              return `Consumption: ${context.parsed.y}`;
            }
          }
        }
      }
    }
  });
}

function showAnomalyTable(anomalies) {
  const table = document.getElementById('anomaly-table');
  if (!anomalies.length) {
    table.innerHTML = '<tr><td class="px-4 py-3 text-xs sm:text-sm text-slate-400">No anomalies detected</td></tr>';
    return;
  }
  table.innerHTML =
    '<thead class="bg-slate-900/80 sticky top-0 z-10">' +
      '<tr>' +
        '<th class="px-4 py-2 text-[11px] sm:text-xs font-semibold text-slate-300 border-b border-slate-800/80">Timestamp</th>' +
        '<th class="px-4 py-2 text-[11px] sm:text-xs font-semibold text-slate-300 border-b border-slate-800/80">Consumption</th>' +
      '</tr>' +
    '</thead>' +
    '<tbody class="divide-y divide-slate-800/80">' +
      anomalies.map(row =>
        `<tr class="hover:bg-slate-900/80 transition-colors duration-150">` +
          `<td class="px-4 py-2 text-[11px] sm:text-xs text-slate-200 whitespace-nowrap">${row.timestamp}</td>` +
          `<td class="px-4 py-2 text-[11px] sm:text-xs text-red-300 font-medium">${row.consumption}</td>` +
        `</tr>`
      ).join('') +
    '</tbody>';
}

// Footer year helper (non-critical, purely cosmetic)
const yearSpan = document.getElementById('year-span');
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}
