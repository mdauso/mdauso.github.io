document.addEventListener("DOMContentLoaded", function () {
  let debugBox = document.getElementById("debugContainer");
  debugBox.style.bottom = "100px"; // Debug-Fenster weiter unten setzen
});

let currentSurface = null;

// 🎯 Standardkamera (Default-Ansicht)
const DEFAULT_CAMERA = {
  eye:    { x: -1.3, y: -1.3, z: 1.8 },
  center: { x: 0,   y: 0,   z: 0   },
  up:     { x: 0,   y: 0,   z: 1   }
};

// 🔄 CSV-Datei einlesen & verarbeiten
document.getElementById('csvFile').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let raw = e.target.result.trim();
      const lines = raw.split('\n').filter(line => line);
      if (lines.length < 2) return updateError('CSV enthält keine Datenzeilen.');

      // **CSV-Daten in Arrays umwandeln**
      const [rpm, throttle, lambda] = lines.slice(1).reduce((acc, line) => {
        let values = line.split(';').map(v => parseFloat(v.replace(',', '.')));
        if (values.length >= 5 && values.every(n => !isNaN(n))) {
          acc[0].push(values[1]); // RPM
          acc[1].push(values[2]); // Throttle
          acc[2].push(values[4]); // Lambda
        }
        return acc;
      }, [[], [], []]);

      if (rpm.length === 0) return updateError("Keine gültigen Daten in der CSV gefunden!");

      // **BIN-Werte berechnen**
      const rpmStep = parseFloat(document.getElementById('rpmStepInput').value) || 500;
      const thrStep = parseFloat(document.getElementById('thrStepInput').value) || 5;

      const createBins = (data, step) => [...new Set(data.map(v => Math.round(v / step) * step))].sort((a, b) => a - b);
      const rpmBins = createBins(rpm, rpmStep);
      const thrBins = createBins(throttle, thrStep);

      // **Matrix für Binning vorbereiten**
      const sumMatrix = Array.from({ length: thrBins.length }, () => Array(rpmBins.length).fill(0));
      const countMatrix = Array.from({ length: thrBins.length }, () => Array(rpmBins.length).fill(0));
      const zMatrix = Array.from({ length: thrBins.length }, () => Array(rpmBins.length).fill(null));

      let validData = false;
      rpm.forEach((rVal, i) => {
        let rIdx = rpmBins.indexOf(Math.round(rVal / rpmStep) * rpmStep);
        let tIdx = thrBins.indexOf(Math.round(throttle[i] / thrStep) * thrStep);
        if (rIdx >= 0 && tIdx >= 0) {
          sumMatrix[tIdx][rIdx] += lambda[i];
          countMatrix[tIdx][rIdx] += 1;
          validData = true;
        }
      });

      // **Durchschnittswerte für Binning berechnen**
      thrBins.forEach((_, tIdx) => {
        rpmBins.forEach((_, rIdx) => {
          if (countMatrix[tIdx][rIdx] > 0) {
            zMatrix[tIdx][rIdx] = sumMatrix[tIdx][rIdx] / countMatrix[tIdx][rIdx];
          }
        });
      });

      if (!validData) return updateError("Alle Bins enthalten nur Null-Werte!");

      console.log("🔥 RPM-Bins:", rpmBins);
      console.log("🔥 Throttle-Bins:", thrBins);
      console.log("🔥 Z-Werte (Lambda):", zMatrix);

      updateDebugTable(rpmBins, thrBins, zMatrix);
      plotGraph(rpmBins, thrBins, zMatrix);

    } catch (err) {
      console.error("🔥 Fehler:", err.message);
      updateError('Fehler: ' + err.message);
    }
  };
  reader.readAsText(file);
});

// 🔍 Debug-Tabelle aktualisieren
function updateDebugTable(rpmBins, thrBins, zMatrix) {
  const debugTable = [
    `<table class="data-table"><thead><tr>
      <th>RPM</th><th>Throttle</th><th>Lambda</th></tr></thead><tbody>`,
    ...thrBins.flatMap((t, tIdx) => 
      rpmBins.map((r, rIdx) => 
        `<tr><td>${r}</td><td>${t}</td><td>${zMatrix[tIdx][rIdx] !== null ? zMatrix[tIdx][rIdx].toFixed(2) : "N/A"}</td></tr>`
      )
    ),
    `</tbody></table>`
  ].join('');
  
  document.getElementById('debugOutput').innerHTML = debugTable;
}

// 📊 Plotly-Graph aktualisieren
function plotGraph(rpmBins, thrBins, zMatrix) {
  currentSurface = {
    x: rpmBins,
    y: thrBins,
    z: zMatrix,
    type: 'surface',
    colorscale: 'Rainbow',
    cmin: 0.65,
    cmax: 1,
    showscale: true
  };

  const layout = {
  scene: {
    aspectmode: 'manual',
    aspectratio: { x: 3, y: 2, z: 1 },
    xaxis: { title: 'RPM (U/min)' },
    yaxis: { title: 'Throttle Position (%)' },
    zaxis: { title: 'Lambda' },
    camera: DEFAULT_CAMERA // 🔒 Default-Ansicht beim ersten Render
  },
  uirevision: 'keep' // 🧷 verhindert Kamera-Reset bei Updates
};

  Plotly.newPlot('plot', [currentSurface], layout);
}

// 🎨 Farbskala anpassen
document.getElementById('applyColorBtn').addEventListener('click', function() {
  if (!currentSurface) return alert('Bitte zuerst eine CSV-Datei laden!');

  let newScale = document.getElementById('scaleSelect').value;
  let cmin = parseFloat(document.getElementById('cminInput').value);
  let cmax = parseFloat(document.getElementById('cmaxInput').value);
  
  if (isNaN(cmin) || isNaN(cmax)) return alert("Bitte gültige Werte für die Farbskala eingeben!");

  console.log(`🔥 Neue Farbskala: ${newScale}, cmin: ${cmin}, cmax: ${cmax}`);

  currentSurface.colorscale = newScale;
  currentSurface.cmin = cmin;
  currentSurface.cmax = cmax;

  Plotly.react('plot', [currentSurface], {
  scene: {
    aspectmode: 'manual',
    aspectratio: { x: 3, y: 2, z: 1 },
    xaxis: { title: 'RPM (U/min)' },
    yaxis: { title: 'Throttle Position (%)' },
    zaxis: { title: 'Lambda' }
    // ❗ KEIN camera hier – sonst überschreibst du die Nutzeransicht
  },
  uirevision: 'keep'
});
});

// 🔥 Fehler ausgeben
function updateError(message) {
  document.getElementById('error').textContent = message;
}

// 🌍 Debug-Fenster beweglich machen
dragElement(document.getElementById("debugContainer"));

function dragElement(el) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  document.getElementById("debugHeader").onmousedown = function(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = function(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      el.style.top = (el.offsetTop - pos2) + "px";
      el.style.left = (el.offsetLeft - pos1) + "px";
    };
  };

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
