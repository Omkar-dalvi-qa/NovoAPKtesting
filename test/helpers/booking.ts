// Shared steps for the ticket-booking flow, reused across specs that only
// differ in how they pick a movie/showtime (e.g. plain vs. filtered by experience).

export async function dismissOnboarding() {
    try {
        const qatar = await $('android=new UiSelector().textContains("QATAR")');
        if (await qatar.isExisting()) {
            await qatar.click();
            await (await $('android=new UiSelector().textContains("English")')).click();
            await (await $('android=new UiSelector().textContains("SKIP")')).click();
        }
    } catch (err) {
        console.log('Onboarding already completed or not shown, continuing...');
    }
}


export async function filterByExperience(experience: string) {
    // Give the app a brief moment to settle before checking for the home screen.
    await browser.pause(1500);
    // Wait for home screen to load before tapping the filter icon.
    await browser.waitUntil(
        async () => (await (await $$('android=new UiSelector().descriptionContains("Interested")')).length) > 0,
        { timeout: 60000, timeoutMsg: 'Home screen did not load before applying filter' }
    );

    // The filter icon has no content-desc, so it's tapped by fixed coordinates
    // (bounds [921,1073][1029,1181] on the pinned test device/resolution).
    await browser.action('pointer', { parameters: { pointerType: 'touch' } })
        .move({ x: 975, y: 1127 })
        .down()
        .up()
        .perform();

    const experienceRow = await $('android=new UiSelector().descriptionContains("Experience")');
    await experienceRow.waitForExist({ timeout: 10000 });
    await experienceRow.click();

    const option = await $(`android=new UiSelector().description("${experience}")`);
    await option.waitForExist({ timeout: 10000 });
    await option.click();

    const done = await $('android=new UiSelector().descriptionContains("DONE")');
    await done.waitForExist({ timeout: 10000 });
    await done.click();

    // Brief buffer for the filtered list to actually re-render. Kept short
    // rather than removed: openFirstMovieAndShowtime's wait only checks that
    // *some* movie cards exist, which the pre-filter list would already
    // satisfy, so cutting this too much risks grabbing a stale (unfiltered)
    // first card instead of the real filtered one.
    await browser.pause(2000);
}

// Selects the first movie card ("<Title>\n<Rating>\n<N> Interested") and the
// first showtime slot for it (content-desc starts with a time like "11:25 AM").
export async function openFirstMovieAndShowtime() {
    const movieSelector = 'android=new UiSelector().descriptionContains("Interested")';
    await browser.waitUntil(async () => (await (await $$(movieSelector)).length) > 0, {
        timeout: 60000,
        timeoutMsg: 'No movie cards appeared on the home screen',
    });
    const movies = await $$(movieSelector);
    await movies[0].click();

    const showtimeSelector = 'android=new UiSelector().descriptionMatches("^\\d{1,2}:\\d{2} (AM|PM).*")';
    await browser.waitUntil(async () => (await (await $$(showtimeSelector)).length) > 0, {
        timeout: 30000,
        timeoutMsg: 'No showtimes appeared after selecting the movie',
    });
    const showtimes = await $$(showtimeSelector);
    await showtimes[0].click();
}

// Selecting a showtime re-shows the "Please! Note" age restriction dialog; confirm it if shown.
export async function confirmAgeDialogIfShown() {
    try {
        const confirmAge = await $('android=new UiSelector().clickable(true).descriptionContains("Confirm")');
        await confirmAge.waitForExist({ timeout: 10000 });
        await confirmAge.click();
    } catch (err) {
        console.log('Age restriction dialog not shown, continuing...');
    }
}

export async function selectFirstAvailableSeat() {
    await browser.pause(3000);

    const seatSelector = 'android=new UiSelector().clickable(true).descriptionMatches("^\\d+$")';
    await browser.waitUntil(async () => (await (await $$(seatSelector)).length) > 0, {
        timeout: 30000,
        timeoutMsg: 'No seat buttons appeared on the seat selection screen',
    });

    const availableSeats = await $$(seatSelector);
    await availableSeats[0].click();
    await browser.pause(1500);
}

export async function selectAvailableSeats(count: number) {
    await browser.pause(3000);

    const seatSelector = 'android=new UiSelector().clickable(true).descriptionMatches("^\\d+$")';
    await browser.waitUntil(async () => (await (await $$(seatSelector)).length) >= count, {
        timeout: 30000,
        timeoutMsg: `Fewer than ${count} seat button(s) appeared on the seat selection screen`,
    });

    // Re-query after each click rather than slicing one array upfront: clicking
    // a seat doesn't remove it from the tree, but re-fetching keeps this
    // resilient if the list re-renders between taps.
    for (let i = 0; i < count; i++) {
        const availableSeats = await $$(seatSelector);
        await availableSeats[i].click();
        await browser.pause(1000);
    }
}

// Opens the Price Details panel (chevron above the seat legend), reads the
// "Total" value, then closes the panel. Returns the total as shown, e.g. "QAR 175.0".
export async function getSeatSelectionTotal(): Promise<string> {
    // The chevron has no content-desc, so it's tapped by fixed coordinates
    // (bounds [490,1742][590,1843] on the pinned test device/resolution).
    await browser.action('pointer', { parameters: { pointerType: 'touch' } })
        .move({ x: 540, y: 1793 })
        .down()
        .up()
        .perform();

    const totalLabel = await $('android=new UiSelector().description("Total")');
    await totalLabel.waitForExist({ timeout: 10000 });
    const totalValue = await $('//*[@content-desc="Total"]/following-sibling::*[1]');
    const total = (await totalValue.getAttribute('content-desc')) ?? '';

    // Press the Android back button to dismiss the panel — more reliable than
    // tapping a fixed coordinate whose position shifts with screen content.
    await browser.back();
    await browser.pause(1000);

    return total;
}

export async function getPaymentPageTotal(): Promise<string> {
    const totalPrice = await $('android=new UiSelector().descriptionContains("Total Price")');
    await totalPrice.waitForExist({ timeout: 15000 });
    const desc = (await totalPrice.getAttribute('content-desc')) ?? ''; // "Total Price\nQAR 177.5"
    return desc.split('\n').pop() ?? desc;
}

export async function applyCbqBankOffer(cardNumber: string) {
    const bankOffersBtn = await $('android=new UiSelector().descriptionContains("Bank Offers (")');
    await bankOffersBtn.waitForExist({ timeout: 10000 });
    await bankOffersBtn.click();

    const cbqRow = await $('android=new UiSelector().description("CBQ Offer")');
    await cbqRow.waitForExist({ timeout: 10000 });
    const loc = await cbqRow.getLocation();
    const size = await cbqRow.getSize();
    await browser.action('pointer', { parameters: { pointerType: 'touch' } })
        .move({ x: loc.x + size.width - 76, y: loc.y + size.height / 2 })
        .down()
        .up()
        .perform();

    const cardInput = await $('android=new UiSelector().className("android.widget.EditText")');
    await cardInput.waitForExist({ timeout: 10000 });
    await cardInput.click();
    await cardInput.setValue(cardNumber);
    await browser.back(); // dismiss the keyboard without leaving the panel

    await browser.pause(500);
    const validateBtn = await $('android=new UiSelector().description("Validate & Apply")');
    await validateBtn.waitForExist({ timeout: 10000 });
    await validateBtn.click();

    const confirmBtn = await $('android=new UiSelector().description("Confirm")');
    await confirmBtn.waitForExist({ timeout: 10000 });
    await confirmBtn.click();
    await browser.pause(4000);

    const removeBtn = await $('android=new UiSelector().description("Remove")');
    await removeBtn.waitForExist({ timeout: 20000 });

    await browser.pause(5000);

    await browser.action('pointer', { parameters: { pointerType: 'touch' } })
        .move({ x: 888, y: 562 })
        .down()
        .up()
        .perform();
}
export async function getPaymentPageTotals(): Promise<{ original: string; final: string }> {
    const totalPrice = await $('android=new UiSelector().descriptionContains("Total Price")');
    await totalPrice.waitForExist({ timeout: 15000 });
    const desc = (await totalPrice.getAttribute('content-desc')) ?? '';
    const amounts = desc.match(/QAR\s*[\d.]+/g) ?? [];
    const original = amounts[0] ?? desc;
    const final = amounts[amounts.length - 1] ?? desc;
    return { original, final };
}

export async function proceed() {
    const proceedBtn = await $('android=new UiSelector().descriptionContains("Proceed")');
    await proceedBtn.waitForExist({ timeout: 10000 });
    await proceedBtn.click();
}

export async function skipFoodAndBeverage() {
    const skipFnB = await $('android=new UiSelector().descriptionContains("Skip F&B")');
    await skipFnB.waitForExist({ timeout: 15000 });
    await skipFnB.click();
    await browser.pause(4000);
}
