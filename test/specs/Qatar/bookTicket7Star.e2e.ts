import {
    dismissOnboarding,
    filterByExperience,
    openFirstMovieAndShowtime,
    confirmAgeDialogIfShown,
    selectFirstAvailableSeat,
    getSeatSelectionTotal,
    proceed,
    getPaymentPageTotal,
} from '../../helpers/booking';

describe('Book a 7 Star 2D movie ticket', () => {
    it('should filter by 7 Star 2D and select the first available seat', async () => {
        await dismissOnboarding();
        await filterByExperience('7 Star 2D');
        await openFirstMovieAndShowtime();
        await confirmAgeDialogIfShown();
        await selectFirstAvailableSeat();

        const seatSelectionTotal = await getSeatSelectionTotal();
        console.log(`Seat selection Total: ${seatSelectionTotal}`);

        
        await proceed();

        const paymentPageTotal = await getPaymentPageTotal();
        console.log(`Payment page Total Price: ${paymentPageTotal}`);
    });
});
