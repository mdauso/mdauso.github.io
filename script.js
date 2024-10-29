        <script>
        let device;
        let targetDeviceName = 'HMSoft';
        let serialCharacteristic;

        // Temperatur-Array zur Umrechnung des Temperaturwerts
        const Temperature_Array = [80, 78, 77, 75, 74, 73, 71, 70, 68, 67, 65, 64, 63, 61, 60, 59, 58, 56, 55, 54, 52, 51, 50, 49, 48, 46, 45, 44, 43, 42, 41, 40, 39, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 18, 17, 16, 15, 14, 13, 12, 11, 11, 10, 9, 8, 7, 6, 5, 5, 4, 3, 2, 1, 1, 0];

        document.getElementById('connectBtn').addEventListener('click', async () => {
            try {
                device = await navigator.bluetooth.requestDevice({
                    filters: [{ name: targetDeviceName }],
                    optionalServices: ['FFE0']
                });
                
                const server = await device.gatt.connect();
                const service = await server.getPrimaryService('FFE0');
                serialCharacteristic = await service.getCharacteristic('FFE1');
                
                serialCharacteristic.startNotifications();
                serialCharacteristic.addEventListener('characteristicvaluechanged', handleSerialData);
            } catch (error) {
                console.log('Fehler beim Verbinden mit dem Gerät:', error);
            }
        });

        function handleSerialData(event) {
            const value = event.target.value;
            let data = new Uint8Array(value.buffer);

            if (data.length === 8) {
                // AFR-Wert: byte 0 geteilt durch 10
                let lambdawert = data[0] / 10.0;

                // Temperaturwert: byte 1 als Index für das Temperature_Array
                let tempIndex = data[1];
                let sondentemperatur = (tempIndex >= 0 && tempIndex < Temperature_Array.length) 
                    ? Temperature_Array[tempIndex] 
                    : '--'; // Fallback, falls der Index ungültig ist

                updateValues(lambdawert, sondentemperatur);
            } else {
                console.log('Ungültiges Datenpaket empfangen:', data);
            }
        }

        function updateValues(lambdaValue, tempValue) {
            document.getElementById('lambdaValue').textContent = lambdaValue.toFixed(1); // Zeige Lambdawert (AFR)
            document.getElementById('tempValue').textContent = tempValue.toString();      // Zeige Temperatur
        }
    </script>
