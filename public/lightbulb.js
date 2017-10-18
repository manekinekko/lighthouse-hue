class LightBulb {

    constructor() {
        this.ledCharacteristic = null;
        this.poweredOn = false;
        this.pulsingTimer = null;
    }
    async connect() {
        console.log('Requesting Bluetooth Device...');
        return navigator.bluetooth.requestDevice({
                filters: [{ services: [0xffe5] }]
            })
            .then(device => {
                console.log('> Found ' + device.name);
                console.log('Connecting to GATT Server...');
                device.addEventListener('gattserverdisconnected', () => {
                    console.log('Device disconnected');
                });
                return device.gatt.connect();
            })
            .then(server => {
                console.log('Getting Service 0xffe5 - Light control...');
                return server.getPrimaryService(0xffe5);
            })
            .then(service => {
                console.log('Getting Characteristic 0xffe9 - Light control...');
                return service.getCharacteristic(0xffe9);
            })
            .then(async(characteristic) => {
                console.log('All ready!');
                this.ledCharacteristic = characteristic;
                this.powerOff();
            })
            .catch(error => {
                console.log('Argh! ' + error);
            });
    }

    isConnected() {
        return this.ledCharacteristic !== null;
    }

    powerOn() {
        let data = new Uint8Array([0xcc, 0x23, 0x33]);
        return this.ledCharacteristic.writeValue(data)
            .then(() => {
                this.poweredOn = true;
            })
            .catch(err => console.log('Error when powering on! ', err))
    }

    powerOff() {
        let data = new Uint8Array([0xcc, 0x24, 0x33]);
        return this.ledCharacteristic.writeValue(data)
            .then(() => {
                this.poweredOn = false;
            })
            .catch(err => console.log('Error when switching off! ', err))
    }

    async pulseLightsOn() {
        await this.powerOn();
        await this.sendColor([255, 255, 255], 0x0f);
        this.isPulsing = true;
        const pulse = async() => {
            this.pulsingTimer = setTimeout(async(_) => {
                if (this.poweredOn) await this.powerOff();
                else await this.powerOn();
                await pulse();
                console.log('pulsing...');
            }, 2000);
        }
        pulse();
    }

    pulseLightsOff() {
        clearTimeout(this.pulsingTimer);
        console.log(this.pulsingTimer);
    }

    async setColorBasedOnScore(score) {
        let color = this.hexToRgb('#ff0000'); // poor
        if (score > 45) {
            color = this.hexToRgb('#ef6c00'); // average
        }
        if (score > 75) {
            color = this.hexToRgb('#009305'); // good
        }

        await this.powerOn();
        await this.sendColor(color);
    }

    hexToRgb(hex) {
        if (hex.startsWith('#')) {
            hex = hex.slice(1);
        }

        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    }

    sendColor([red, green, blue], white = 0x00) {
        let data = new Uint8Array([0x56, red, green, blue, white, 0xf0, 0xaa]);
        return this.ledCharacteristic.writeValue(data)
            .catch(err => console.log('Error when writing value! ', err));
    }
}