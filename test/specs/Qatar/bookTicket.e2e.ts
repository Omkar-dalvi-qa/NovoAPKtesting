import {
    dismissOnboarding,
    openFirstMovieAndShowtime,
    confirmAgeDialogIfShown,
    selectFirstAvailableSeat,
    proceed,
    skipFoodAndBeverage,
} from '../../helpers/booking';

describe('Book a movie ticket', () => {
    it('should select the first available seat', async () => {
        await dismissOnboarding();
        await openFirstMovieAndShowtime();
        await confirmAgeDialogIfShown();
        await selectFirstAvailableSeat();
        await proceed();
        await skipFoodAndBeverage();
    });
});
