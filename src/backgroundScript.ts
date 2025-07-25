// This script is always running in the background once the extension is installed.
import config from './config';
import { CphSubmitResponse, CphEmptyResponse } from './types';
import { handleSubmit } from './handleSubmit';
import log from './log';

const mainLoop = async () => {
    let cphResponse;
    try {
        const headers = new Headers();
        headers.append('cph-submit', 'true');

        const request = new Request(config.cphServerEndpoint.href, {
            method: 'GET',
            headers,
        });

        cphResponse = await fetch(request);
    } catch (err) {
        log('Error while fetching cph response', err);
        return;
    }

    if (!cphResponse.ok) {
        log('Error while fetching cph response', cphResponse);
        return;
    }

    const response: CphSubmitResponse | CphEmptyResponse =
        await cphResponse.json();

    if (response.empty) {
        log('Got empty valid response from CPH');

        return;
    }

    log('Got non-empty valid response from CPH');
    handleSubmit(
        response.problemName,
        response.languageId,
        response.sourceCode,
        response.url,
    );
};


chrome.alarms.create('cph-submit-alarm', {
    periodInMinutes: 1 / 60,
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'cph-submit-alarm') {
        await mainLoop();
    }
});
