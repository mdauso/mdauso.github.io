        let device;
        let serialCharacteristic;
        let buffer = [];
        let lastCharTime = 0;
        const CHARS_PER_FRAME = 9;
        const START_CODE = 1;
        const GAP_TIME_MS = 40;

Temperature_Array[] ={80, 78, 77, 75, 74, 73, 71, 70, 68, 67, 65, 64, 63, 61, 60, 59, 58, 56, 55, 54, 52, 51, 50, 49, 48, 46, 45, 44, 43, 42, 
41, 40, 39, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 18, 17, 16, 15, 14, 13, 12, 11, 11, 10, 9, 8, 7, 6, 5, 5, 4, 3, 2, 
1, 1, 0};

        document.getElementById('connectBtn').addEventListener('click', async () => {
            try {
                device = await navigator.bluetooth.requestDevice({
                    filters: [{ name: 'HMSoft' }], // Changed device name to "HMSoft"
                    optionalServices: ['FFE0']
                });
                const server = await device.gatt.connect();
                const service = await server.getPrimaryService('FFE0');
                serialCharacteristic = await service.getCharacteristic('FFE1');
                await serialCharacteristic.startNotifications();
                serialCharacteristic.addEventListener('characteristicvaluechanged', handleSerialData);
            } catch (error) {
                console.error('Connection failed:', error);
            }
        });

        function handleSerialData(event) {
            const now = Date.now();
            if (now - lastCharTime > GAP_TIME_MS) {
                buffer = []; // Reset buffer on timeout gap
            }
            lastCharTime = now;

            const data = new Uint8Array(event.target.value.buffer);
            for (let byte of data) {
                buffer.push(byte);

                // Only process when we have enough bytes
                if (buffer.length >= CHARS_PER_FRAME) {
                    processFrame(buffer.slice(0, CHARS_PER_FRAME));
                    buffer = buffer.slice(CHARS_PER_FRAME);
                }
            }
        }

        function processFrame(data) {
            // Check if the frame starts with the correct sync byte
            if (data[0] !== START_CODE) {
                console.warn("Invalid start byte:", data[0]);
                return;
            }

            const afrCode = data[1];
            const tempCode = data[2];

            // Verify filler bytes match the expected sequence (2, 3, 4, 5, 6)
            for (let i = 3; i <= 7; i++) {
                if (data[i] !== i - 1) {
                    console.warn("Filler byte mismatch at index", i, "value:", data[i]);
                    return;
                }
            }

            // Check if byte 8 repeats AFR value (data[1])
            if (data[8] !== afrCode) {
                console.warn("AFR repeat mismatch at byte 8:", data[8]);
                return;
            }

            // Calculate and display AFR and temperature
            const lambdaValue = afrCode / 147;
            const temperature = tempCode;
            updateValues(lambdaValue, temperature);
        }

        function updateValues(lambdaValue, temperature) {
            document.getElementById('lambdaValue').textContent = lambdaValue.toFixed(2);
            document.getElementById('tempValue').textContent = temperature.toString();
        }
