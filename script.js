        let device;
        let targetDeviceName = 'HMSoft'; // Ersetze dies mit dem Gerätenamen deines HC-10 oder eines anderen Geräts
        let serialCharacteristic;

let Temperature_Array[] ={80, 78, 77, 75, 74, 73, 71, 70, 68, 67, 65, 64, 63, 61, 60, 59, 58, 56, 55, 54, 52, 51, 50, 49, 48, 46, 45, 44, 43, 42, 
                                  41, 40, 39, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 18, 17, 16, 15, 14, 13, 12, 11, 11, 10, 9, 8, 7, 6, 5, 5, 4, 3, 2, 
                                1, 1, 0}; 

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

                    
                
                // Lambda-Wert: byte 0 geteilt durch 147
                let lambdawert = data[0];

                // Temperaturwert: byte 1 direkt als °C
                //let sondentemperatur = data[1];
                let sondentemperatur = 113;

                if (sondentemperatur<113) 
                { 
                sondentemperatur=113; 
                } 
                    
                if (sondentemperatur>187) 
                { 
                 sondentemperatur=187; 
                } 
                    
                sondentemperatur_out =Temperature_Array[sondentemperatur-113]+740;

                updateValues(lambdawert, sondentemperatur_out);
            } else {
                console.log('Ungültiges Datenpaket empfangen:', data);
            }
        }

        function updateValues(lambdaValue, tempValue) {
        document.getElementById('lambdaValue').textContent = lambdaValue.toFixed(1); // Zeige Lambdawert (AFR)
        document.getElementById('tempValue').textContent = tempValue.toString();      // Zeige Temperatur
            
        }
