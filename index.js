/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const fs = require('fs');
const opn = require('opn');
const yargs = require('yargs');
const ReportGeneratorV2 = require('lighthouse/lighthouse-core/report/v2/report-generator');
const Log = require('lighthouse-logger');
const LighthouseRunner = require('./src/runner');
const APP_DESCRIPTION = 'Lighthouse';

const flags = yargs
    .help('h')
    .alias('h', 'help')
    .usage('Usage: $0 URL')
    .version(() => require('./package.json').version)
    .alias('v', 'version')
    .showHelpOnFail(false, 'Specify --help for available options')
    .boolean(['reset', 'view', 'headless'])
    .default('output', 'html')
    .default('output-path', './public/results.html')
    .default('log-level', 'info')
    .argv;
flags.chromePath = process.env.CHROME_PATH || null;

const url = yargs.argv._[0];
const runner = new LighthouseRunner(url, flags); //, PERF_CONFIG);

Log.setLevel(flags.logLevel);

/**
 * Runs Lighthouse and saves the HTML report to disk.
 * @return {number} Overall score.
 */
function runLighthouse() {
    return runner.run().then(results => {
        results.artifacts = undefined; // prevent circular references in the JSON.

        let html;
        if (flags.output === 'html') {
            html = new ReportGeneratorV2().generateReportHtml(results);
        }

        fs.writeFileSync(flags.outputPath, html);

        const score = runner.getOverallScore(results);
        runner.print(score);

        return score;
    });
}

let hueLightsAvailable = true;

runLighthouse()
    .then(score => {
        if (flags.view) {
            opn(flags.outputPath, { wait: false });
        }
    }).catch(err => {
        console.error(Log.redify(err));
    });

process.on('unhandledRejection', reason => {
    console.log('Lighthouse runner:', reason);
});