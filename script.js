let device;
let serviceUuid = 'dein_service_uuid'; // Ersetze mit deiner Service UUID
let characteristicUuid = 'dein_characteristic_uuid'; // Ersetze mit deiner Characteristic UUID
let chart;
let uuidButton = document.getElementById('uuid');
let CuuidButton = document.getElementById('Cuuid');

document.getElementById('connectBtn').addEventListener('click', async () => {
try {
  characteristicUuid = CuuidButton.value;
  serviceUuid = uuidButton.value;
  device = await navigator.bluetooth.requestDevice({
  filters: [{ services: [serviceUuid] }]
});

const server = await device.gatt.connect();
const service = await server.getPrimaryService(serviceUuid);
const characteristic = await service.getCharacteristic(characteristicUuid);

characteristic.startNotifications();
characteristic.addEventListener('characteristicvaluechanged', handleSerialData);
} catch (error) {
  console.log('Fehler beim Verbinden mit dem Ger t:', error);
}
}); 

function handleSerialData(event) {
  const value = event.target.value;
  let decoder = new TextDecoder('utf-8');
  let serialData = decoder.decode(value);
  let extractedValues = extractValues(serialData);
  updateChart(extractedValues);
}

function extractValues(data) {
  // Beispiel: Annahme, dass die seriellen Daten als CSV gesendet werden: "Wert1,Wert2"
  let values = data.split(',');
  return {
    value1: parseFloat(values[0]),
    value2: parseFloat(values[1])
  };
}

function updateChart(values) {
  if (!chart) {
    initializeChart();
  }
  
  chart.data.labels.push(new Date().toLocaleTimeString());
  chart.data.datasets[0].data.push(values.value1);
  chart.data.datasets[1].data.push(values.value2);
  chart.update();
}

function initializeChart() {
  const ctx = document.getElementById('dataChart').getContext('2d');
  chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Wert 1',
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        data: []
      },
      {
        label: 'Wert 2',
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        data: []
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'second'
        }
      }
    }
  }
});
}
