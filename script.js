        let device;
        let targetDeviceName = 'HMSoft'; // Ersetze dies mit dem Gerätenamen deines HC-10 oder eines anderen Geräts
        let serialCharacteristic;

        document.getElementById('connectBtn').addEventListener('click', async () => {
            try {
                // Scanne nach Geräten ohne Service UUID, stattdessen durch Namensfilterung
                device = await navigator.bluetooth.requestDevice({
                    filters: [{ name: targetDeviceName }],
                    optionalServices: ['FFE0'] // Optional, falls das Gerät Services bietet, die du ansprechen möchtest
                });
                
                const server = await device.gatt.connect();
                const service = await server.getPrimaryService('FFE0'); // Standardservice für HC-10
                serialCharacteristic = await service.getCharacteristic('FFE1'); // Standardcharakteristik für serielle Daten
                
                serialCharacteristic.startNotifications();
                serialCharacteristic.addEventListener('characteristicvaluechanged', handleSerialData);
            } catch (error) {
                console.log('Fehler beim Verbinden mit dem Gerät:', error);
            }
        });

       /* function handleSerialData(event) {
            const value = event.target.value;
            let data = new Uint8Array(value.buffer); // Umwandlung des Datenpakets in ein 8-Byte-Array

            if (data.length >= 2) {
                let lambdawert = data[0] / 147;  // Erster Byte = Lambdawert
                let sondentemperatur = data[1] * 10;  // Zweiter Byte = Sondentemperatur

                updateValues(lambdawert, sondentemperatur);
            } else {
                console.log('Ungültiges Datenpaket empfangen.');
            }
            
        }

        function updateValues(lambdaValue, tempValue) {
            document.getElementById('lambdaValue').textContent = lambdaValue.toFixed(2); // Zeige den Lambdawert an
            document.getElementById('tempValue').textContent = tempValue.toFixed(0);     // Zeige die Sondentemperatur an
        }
        */
function handleSerialData(event) {
            const value = event.target.value;
            let data = new Uint8Array(value.buffer);

            if (data.length === 8) {
                // AFR-Wert: byte 0 geteilt durch 10
                let lambdawert = data[0] / 14.7;

                // Temperaturwert: byte 1 direkt als °C
                let sondentemperatur = data[1];

                updateValues(lambdawert, sondentemperatur);
            } else {
                console.log('Ungültiges Datenpaket empfangen:', data);
            }
        }

        function updateValues(lambdaValue, tempValue) {
            document.getElementById('lambdaValue').textContent = lambdaValue.toFixed(1); // Zeige Lambdawert (AFR)
            document.getElementById('tempValue').textContent = tempValue.toString();      // Zeige Temperatur
        }
