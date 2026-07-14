// import {
//     dismissOnboarding,
//     filterByExperience,
//     openFirstMovieAndShowtime,
//     confirmAgeDialogIfShown,
//     selectAvailableSeats,
//     applyCbqBankOffer,
//     proceed,
//     skipFoodAndBeverage,
//     getPaymentPageTotals,
// } from '../../helpers/booking';

// describe('Book a 2D movie ticket with a CBQ bank offer', () => {
//     it('should apply the CBQ offer and reduce the total price', async () => {
//         await dismissOnboarding();
//         await filterByExperience('2D');
//         await openFirstMovieAndShowtime();
//         await confirmAgeDialogIfShown();
//         await selectAvailableSeats(2);
//         await applyCbqBankOffer('5524000000000000');
//         await proceed();
//         await skipFoodAndBeverage();

//         const { original, final } = await getPaymentPageTotals();
//         console.log(`Total before offer: ${original}, after offer: ${final}`);

//         const originalAmount = parseFloat(original.replace(/[^\d.]/g, ''));
//         const finalAmount = parseFloat(final.replace(/[^\d.]/g, ''));
//         expect(finalAmount).toBeLessThan(originalAmount);
//     });
// });
