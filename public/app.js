(function() {
    'use strict';

    const input = document.querySelector('#url');
    const logger = document.querySelector('#logger');
    const scoreEl = document.querySelector('#lighthouse-score');
    const reportLink = document.querySelector('#lighthouse-report a');
    const background = document.querySelector('#background');
    const logo = document.querySelector('.logo-section');
    const searchArrow = document.querySelector('.search-arrow');
    const startOver = document.querySelector('#startover');
    const connectBtn = document.querySelector('#connect-btn');
    const connectSection = document.querySelector('#connect-section');
    const urlSection = document.querySelector('#url-section');
    const lb = new LightBulb();

    const params = new URLSearchParams(location.search);
    let setTimeoutId_;

    const KIOSK_MODE = params.has('kiosk');
    if (KIOSK_MODE) {
        document.documentElement.classList.add('kiosk');
        input.placeholder = 'Enter a URL on the screen below';
    } else {
        input.focus();
    }

    /**
     * @param {number} score
     * @return {string}
     */
    function calculateRating(score) {
        let rating = 'poor';
        if (score > 45) {
            rating = 'average';
        }
        if (score > 75) {
            rating = 'good';
        }
        return rating;
    }

    /**
     * @param {(number|string)} score
     */
    function setScore(score) {
        score = Number(score);
        lb.setColorBasedOnScore(score);

        const rating = calculateRating(score);

        scoreEl.textContent = score;
        scoreEl.classList.add(rating);
        document.body.classList.add(rating, 'done');
        document.body.classList.remove('running');
    }

    /**
     * @param {string} url
     */
    function setUrl(url) {
        input.value = url;
    }

    function startNewRun() {
        resetUI(false);
        lb.pulseLightsOn();
        document.body.classList.add('running');
    }

    function finalizeRun() {
        lb.pulseLightsOff();
        setTimeout(async() => {
            lb.powerOff();
        }, 10000);

        const match = logger.value.match(/.*LIGHTHOUSE SCORE:\s+(.*)/);
        if (match) {
            let score = Number(match[1]);
            score = score.toLocaleString(undefined, { maximumFractionDigits: 1 });

            setScore(score);
            reportLink.tabIndex = 0;
            startOver.tabIndex = 0;
            reportLink.focus();

            channel.postMessage({ cmd: 'score', score });

            ga('send', 'event', 'Lighthouse', 'finish run');
        } else {
            const split = logger.value.split('\n');
            ga('send', 'event', 'Lighthouse', 'error', split[split.length - 2]);
        }

        document.body.classList.remove('running');
    }

    function updateLog(data) {
        logger.value += data.replace(/.*GMT\s/, '') + '\n';
        logger.scrollTop = logger.scrollHeight;
    }

    function resetUI(clearInput = true) {
        if (clearInput) {
            input.value = null;
        }
        logger.value = '';
        document.body.className = '';
        reportLink.tabIndex = -1;
        startOver.tabIndex = -1;
        scoreEl.textContent = '';
        scoreEl.className = '';
    }

    /**
     * @param {string} url URL to test in Lighthouse.
     */
    function runLighthouse(url = '') {
        // If user inputs domain, make it a full URL.
        if (!url.match(/^https?:\/\//)) {
            url = `http://${url}`;
            input.value = url;
        }

        if (!url.length || !input.validity.valid) {
            alert('URL is not valid');
            return;
        }

        let endpoint = `/run?url=${url}`;
        if (document.querySelector('#useheadless').checked) {
            endpoint += '&headless=true';
        }

        const source = new EventSource(endpoint);

        source.addEventListener('message', e => {
            if (e.data === 'done') {
                source.close();
                finalizeRun();
                return;
            }

            updateLog(e.data);
            channel.postMessage({ cmd: 'log', log: e.data });
        })

        source.addEventListener('open', e => {
            startNewRun();
            channel.postMessage({ cmd: 'start' });
            ga('send', 'event', 'Lighthouse', 'start run');
        });

        source.addEventListener('error', e => {
            if (e.readyState === EventSource.CLOSED) {
                source.close();
            }
        });
    }

    const channel = new BroadcastChannel('lighthouse-bus');
    channel.onmessage = function(e) {
        switch (e.data.cmd) {
            case 'start':
                startNewRun();
                break;
            case 'score':
                setScore(e.data.score);
                clearInterval(setTimeoutId_); // cancel previous run's timeout.
                // Reset kiosk UI in 2min if a user hasn't by then.
                setTimeoutId_ = setTimeout(resetUI, 60 * 1000 * 2);
                break;
            case 'log':
                updateLog(e.data.log)
                break;
            case 'seturl':
                setUrl(e.data.url);
                break;
            default:
                break;
        }
    };
    // channel.close();

    function attachEventListeners() {
        input.addEventListener('keydown', e => {
            if (e.keyCode === 13) { // Enter
                runLighthouse(e.target.value);
                channel.postMessage({ cmd: 'seturl', url: e.target.value });
            }
        });

        document.addEventListener('click', e => input.focus());

        logo.addEventListener('click', e => {
            if (document.body.classList.contains('done')) {
                fetch('/reset');
                resetUI();
                document.querySelector('#useheadless').checked = false;
            }
        });

        searchArrow.addEventListener('click', e => {
            runLighthouse(input.value);
            channel.postMessage({ cmd: 'seturl', url: input.value });
        });

        startOver.addEventListener('click', e => {
            e.preventDefault();
            resetUI();
            document.querySelector('#useheadless').checked = false;
        });

        reportLink.addEventListener('click', e => {
            ga('send', 'event', 'Lighthouse', 'open report');
        });

        connectBtn.addEventListener('click', async(e) => {
            await lb.connect();
            urlSection.classList.remove('hidden');
            connectSection.classList.add('hidden');
        })
    }

    // Don't add event listeners or setup BroadcastChannel if in kiosk mode.
    if (!KIOSK_MODE) {
        attachEventListeners();
    }


})();