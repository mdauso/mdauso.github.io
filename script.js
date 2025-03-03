document.addEventListener("DOMContentLoaded", function () {
  let debugBox = document.getElementById("debugContainer");
  debugBox.style.bottom = "100px"; // 🔥 Weiter unten setzen (je nach Bedarf erhöhen)
});





let currentSurface = null;

document.getElementById('csvFile').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let raw = e.target.result.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
      const lines = raw.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length < 2) throw new Error('CSV enthält keine Datenzeilen.');

      let rpm = [], throttle = [], lambda = [];

      

      // **Daten für Binning vorbereiten**
      for (let i = 1; i < lines.length; i++) {
        let values = lines[i].split(';');
        if (values.length < 5) continue;

        let rpmVal = parseFloat(values[1].replace(',', '.'));
        let thrVal = parseFloat(values[2].replace(',', '.'));
        let lambdaVal = parseFloat(values[4].replace(',', '.'));

        if (!isNaN(rpmVal) && !isNaN(thrVal) && !isNaN(lambdaVal)) {
          rpm.push(rpmVal);
          throttle.push(thrVal);
          lambda.push(lambdaVal);
        }
      }

      if (rpm.length === 0) throw new Error("Keine gültigen Daten in der CSV gefunden!");

      let rpmStep = parseFloat(document.getElementById('rpmStepInput').value) || 500;
      let thrStep = parseFloat(document.getElementById('thrStepInput').value) || 5;

      let rpmBins = [...new Set(rpm.map(v => Math.round(v / rpmStep) * rpmStep))].sort((a, b) => a - b);
      let thrBins = [...new Set(throttle.map(v => Math.round(v / thrStep) * thrStep))].sort((a, b) => a - b);

      let sumMatrix = Array.from({ length: thrBins.length }, () => Array(rpmBins.length).fill(0));
      let countMatrix = Array.from({ length: thrBins.length }, () => Array(rpmBins.length).fill(0));
      let zMatrix = Array.from({ length: thrBins.length }, () => Array(rpmBins.length).fill(null)); // `null` für Plotly

      let validData = false;
      for (let i = 0; i < rpm.length; i++) {
        let rIdx = rpmBins.indexOf(Math.round(rpm[i] / rpmStep) * rpmStep);
        let tIdx = thrBins.indexOf(Math.round(throttle[i] / thrStep) * thrStep);
        if (rIdx >= 0 && tIdx >= 0) {
          sumMatrix[tIdx][rIdx] += lambda[i];
          countMatrix[tIdx][rIdx] += 1;
          validData = true;
        }
      }

      // **🔍 Fix für ungleichmäßige Arrays**
      for (let t = 0; t < thrBins.length; t++) {
        for (let r = 0; r < rpmBins.length; r++) {
          if (countMatrix[t][r] > 0) {
            zMatrix[t][r] = sumMatrix[t][r] / countMatrix[t][r];
          }
        }
      }

      if (!validData) throw new Error("Alle Bins enthalten nur Null-Werte!");

      // **🔥 Debugging: Werte in Konsole anzeigen**
      console.log("🔥 RPM-Bins:", rpmBins);
      console.log("🔥 Drosselklappen-Bins:", thrBins);
      console.log("🔥 Z-Werte (Lambda):", zMatrix);

      // **🔥 Debug-Tabelle erstellen**
      let debugTable = `<table class="data-table"><thead><tr>
                         <th>BIN-Drehzahl</th>
                         <th>BIN-Drosselklappe</th>
                         <th>BIN-Lambda</th></tr></thead><tbody>`;

      for (let t = 0; t < thrBins.length; t++) {
        for (let r = 0; r < rpmBins.length; r++) {
          let lambdaValue = zMatrix[t][r] !== null ? zMatrix[t][r].toFixed(2) : "N/A";
          debugTable += `<tr>
            <td>${rpmBins[r]}</td>
            <td>${thrBins[t]}</td>
            <td>${lambdaValue}</td>
          </tr>`;
        }
      }

      debugTable += `</tbody></table>`;
      document.getElementById('debugOutput').innerHTML = debugTable;

      console.log("🔥 Debug Tabelle HTML:");
      console.log(document.getElementById('debugOutput').outerHTML);

      // **Graph erstellen**
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

      let layout = {
        scene: {
          aspectmode: 'manual',
          aspectratio: { x: 3, y: 2, z: 1 },
          xaxis: { title: 'Drehzahl (U/min)' },
          yaxis: { title: 'Drosselklappenstellung (%)' },
          zaxis: { title: 'Lambda' }
        }
      };

      Plotly.newPlot('plot', [currentSurface], layout);

    } catch (err) {
      console.error("🔥 Fehler im Debug- oder Graphenbereich:", err.message);
      document.getElementById('error').textContent = 'Fehler: ' + err.message;
    }
  };
  reader.readAsText(file);
});

// 🔥 Event-Listener für Farbskala-Einstellungen
document.getElementById('applyColorBtn').addEventListener('click', function() {
  if (!currentSurface) {
    alert('Bitte zuerst eine CSV-Datei laden!');
    return;
  }

  let newScale = document.getElementById('scaleSelect').value;
  let cmin = parseFloat(document.getElementById('cminInput').value);
  let cmax = parseFloat(document.getElementById('cmaxInput').value);

  if (isNaN(cmin) || isNaN(cmax)) {
    alert("Bitte gültige Werte für die Farbskala eingeben!");
    return;
  }

  console.log(`🔥 Neue Farbskala: ${newScale}, cmin: ${cmin}, cmax: ${cmax}`);

  // 🔥 `currentSurface` aktualisieren, damit sich die Farbskala mehrfach ändern lässt
  currentSurface.colorscale = newScale;
  currentSurface.cmin = cmin;
  currentSurface.cmax = cmax;

  // 🔥 Graph mit `Plotly.react()` neu rendern, damit Änderungen dauerhaft übernommen werden
  Plotly.react('plot', [currentSurface], {
    scene: {
      aspectmode: 'manual',
      aspectratio: { x: 3, y: 2, z: 1 },
      xaxis: { title: 'Drehzahl (U/min)' },
      yaxis: { title: 'Drosselklappenstellung (%)' },
      zaxis: { title: 'Lambda' }
    }
  });

  console.log("🔥 Farbskala erfolgreich aktualisiert!");
});

// 🌍 Debug-Fenster beweglich machen
dragElement(document.getElementById("debugContainer"));

function dragElement(el) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  document.getElementById("debugHeader").onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    el.style.top = (el.offsetTop - pos2) + "px";
    el.style.left = (el.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function resizeElement(e) {
  debugContainer.style.width = Math.max(200, e.clientX - debugContainer.offsetLeft) + "px";
  debugContainer.style.height = Math.max(300, e.clientY - debugContainer.offsetTop) + "px"; // 🔥 Mindesthöhe 300px
}

// 🔥 Debug-Daten in die Box schreiben
function updateDebugOutput(message) {
  let debugBox = document.getElementById('debugOutput');
  debugBox.innerHTML += `<p>${message}</p>`;
  debugBox.scrollTop = debugBox.scrollHeight; // Scrollt automatisch nach unten
}

// 🛠 Test: Debug-Daten einfügen
setTimeout(() => {
    updateDebugOutput("📂 waiting for data...");
  }, 1000);



