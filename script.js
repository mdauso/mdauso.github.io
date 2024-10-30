let device;
        let targetDeviceName = 'HMSoft';
        let serialCharacteristic;
        let buffer = [];

        const Temperature_Array = [80, 78, 77, 75, 74, 73, 71, 70, 68, 67, 65, 64, 63, 61, 60, 59, 58, 56, 55, 54, 52, 51, 50, 49, 48, 46, 45, 44, 43, 42, 41, 40, 39, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 18, 17, 16, 15, 14, 13, 12, 11, 11, 10, 9, 8, 7, 6, 5, 5, 4, 3, 2, 1, 1, 0];

        document.getElementById('connectBtn').addEventListener('click', async () => {
            try {
                console.log('Versuche, mit dem Gerät zu verbinden...');
                device = await navigator.bluetooth.requestDevice({
                    filters: [{ name: targetDeviceName }],
                    optionalServices: ['FFE0']
                });
                
                console.log('Verbindung zum Gerät wird hergestellt...');
                const server = await device.gatt.connect();
                
                console.log('Primären Service FFE0 suchen...');
                const service = await server.getPrimaryService('FFE0');
                
                console.log('Charakteristik FFE1 wird abgerufen...');
                serialCharacteristic = await service.getCharacteristic('FFE1');
                
                console.log('Start der Benachrichtigungen für die Charakteristik FFE1...');
                await serialCharacteristic.startNotifications();
                serialCharacteristic.addEventListener('characteristicvaluechanged', handleSerialData);
                console.log('Verbindung und Benachrichtigungen erfolgreich eingerichtet.');
            } catch (error) {
                console.error('Fehler beim Verbinden mit dem Gerät:', error);
            }
        });

        function handleSerialData(event) {
            const value = event.target.value;
            let data = new Uint8Array(value.buffer);

            console.log('Daten empfangen:', data);
            for (let byte of data) {
                buffer.push(byte);

                // Wenn der Puffer 8 Bytes enthält, verarbeiten wir das Paket
                if (buffer.length >= 8) {
                    processPacket(buffer.slice(0, 8)); // Sende die ersten 8 Bytes zur Verarbeitung
                    buffer = buffer.slice(8);          // Entferne die verarbeiteten 8 Bytes
                }
            }
        }

        function processPacket(data) {
            if (data.length !== 8) return; // Sicherheitscheck für Paketlänge

            // Lambda- und Temperaturwerte aus dem Datenpaket lesen
            let AFR = parseInt(data[0]) / 10.0; // Afr-Wert
            let tempIndex = parseInt(data[1]);         // Temperaturindex

            // Plausibilitätsprüfung: Lambda im Bereich 10 - 20 AFR und Temperaturindex gültig
            if (AFR < 10 || AFR > 20) {
                console.warn("Unplausibler AFR:", AFR);
                return;
            }

            if (tempIndex < 113)
            {
            tempIndex = 113;
            }
            
            if (tempIndex > 187)
            {
            tempIndex = 187;
            }

            // Temperatur berechnen anhand des Arrays
            let sondentemperatur = Temperature_Array[tempIndex - 113] + 740;

            let lambdawert = AFR / 14.5;

            console.log(`Lambdawert: ${lambdawert}, Temperatur: ${sondentemperatur}`);
            updateValues(lambdawert, sondentemperatur);
        }

        function updateValues(lambdaValue, tempValue) {
            document.getElementById('lambdaValue').textContent = lambdaValue.toFixed(2);
            document.getElementById('tempValue').textContent = tempValue.toFixed(0);
        }
      
