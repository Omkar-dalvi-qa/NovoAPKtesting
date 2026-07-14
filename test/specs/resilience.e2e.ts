import { execFileSync } from 'node:child_process';
import {
    dismissOnboarding,
    openFirstMovieAndShowtime,
    confirmAgeDialogIfShown,
    selectFirstAvailableSeat,
} from '../helpers/booking';

const APP_PACKAGE = 'com.grandcinema.gcapp.screens';
// Must match capabilities['appium:udid'] in wdio.conf.ts.
const DEVICE_UDID = '91829888';

function adbShell(...args: string[]): string {
    return execFileSync('adb', ['-s', DEVICE_UDID, 'shell', ...args], { encoding: 'utf-8' });
}

// Drives the app from the home screen to the seat selection screen and selects the
// first available seat. Used as the shared "mid-flow" interruption point below.
async function navigateToSeatSelection() {
    await dismissOnboarding();
    await openFirstMovieAndShowtime();
    await confirmAgeDialogIfShown();
    await selectFirstAvailableSeat();
}

// Taps "Proceed" and waits for the F&B/checkout screen, without skipping past it,
// so the interruption in the test below actually lands on the checkout screen.
async function proceedToCheckout() {
    const proceed = await $('android=new UiSelector().descriptionContains("Proceed")');
    await proceed.waitForExist({ timeout: 10000 });
    await proceed.click();

    const skipFnB = await $('android=new UiSelector().descriptionContains("Skip F&B")');
    await skipFnB.waitForExist({ timeout: 15000 });
}

describe('Interruption / Resilience Testing', () => {

    beforeEach(async () => {
        // Start every scenario from a clean, known app state.
        await browser.terminateApp(APP_PACKAGE);
        await browser.activateApp(APP_PACKAGE);
    });

    it('resumes correctly when interrupted during checkout (incoming call / notification proxy)', async () => {
        // Real hardware has no safe way to inject an actual GSM call or notification;
        // browser.background() triggers the same Activity onPause/onStop -> onResume
        // transition the app goes through when a call UI or notification shade takes focus.
        await navigateToSeatSelection();
        await proceedToCheckout();

        await browser.background(5);

        const skipFnBAfterResume = await $('android=new UiSelector().descriptionContains("Skip F&B")');
        await expect(skipFnBAfterResume).toExist();
        await expect(skipFnBAfterResume).toBeDisplayed();
    });

    it('preserves flow state when backgrounded mid-flow and resumed', async () => {
        await navigateToSeatSelection();

        await browser.background(15);

        const proceed = await $('android=new UiSelector().descriptionContains("Proceed")');
        await expect(proceed).toExist();
        await expect(proceed).toBeDisplayed();
    });

    it('recovers gracefully after a force-close and reopen', async () => {
        await navigateToSeatSelection();

        await browser.terminateApp(APP_PACKAGE);
        await browser.activateApp(APP_PACKAGE);

        // With noReset:true a cold-started app isn't expected to restore the in-progress
        // booking; "graceful recovery" here means it comes back to a valid, interactive
        // screen instead of crashing, hanging, or showing a blank/error state.
        const movieSelector = 'android=new UiSelector().descriptionContains("Interested")';
        await browser.waitUntil(async () => (await (await $$(movieSelector)).length) > 0, {
            timeout: 60000,
            timeoutMsg: 'App did not return to a valid home screen after relaunch',
        });
        const movies = await $$(movieSelector);
        await expect(movies[0]).toBeDisplayed();
    });

    // it('remains responsive under a simulated critically-low battery level', async () => {
    //     try {
    //         adbShell('dumpsys', 'battery', 'set', 'level', '5');
    //         const status = adbShell('dumpsys', 'battery');
    //         const levelSpoofed = /level:\s*5/.test(status);

    //         if (!levelSpoofed) {
    //             console.log('Device/OEM ignored the simulated battery level change; skipping this scenario.');
    //             return;
    //         }

    //         await navigateToSeatSelection();
    //         const proceed = await $('android=new UiSelector().descriptionContains("Proceed")');
    //         await expect(proceed).toBeDisplayed();
    //     } finally {
    //         adbShell('dumpsys', 'battery', 'reset');
    //     }
    // });
});
