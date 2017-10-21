[Lighthouse](https://github.com/GoogleChrome/lighthouse) changing the color
of [MagicLight Bluetooth Smart Light Bulb](https://www.magiclightbulbs.com/collections/bluetooth-bulbs/) based on overall report score.

This project was inspired by [Eric Bidelman's Lighthouse Kiosk at Google I/O 2017](https://github.com/ebidel/lighthouse-hue).

### Get started

    yarn install

If you've already installed the app and just want to pull the latest deps:

    yarn upgrade

### Run it

#### Kiosk mode

To run "kiosk mode", use:

    yarn kiosk

This will start a webserver and open two browser windows to the app. One is a
kiosk UI (http://localhost:8080?kiosk) that you should drag to a larger monitor
and the other is where users input a URL to test Lighthouse (http://localhost:8080).

#### Standalone mode

To only start a webserver, use:

    yarn start

#### Running stable Chrome

To run a different version of Chrome (e.g. Stable), specify the `CHROME_PATH` env variable:

```
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" yarn start
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" yarn kiosk
```

### Setup it

```
node index.js <URL>
node index.js --view <URL>
node index.js --output=json --output-path=results.json <URL>
```

This should launch Chrome and run Lighthouse against the URL that you input.
