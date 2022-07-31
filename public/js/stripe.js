import { displayAlert } from './alerts';

const stripe = Stripe('pk_test_51LLsSgSBL2nT2eL4pYUBBPB1p9dneEzSdZlyY0b0F3ihgem9QKLW2oVA98CYVdqf49W0q3nwDPBg6WWqvOWNjDtc00OV36iroX');

export const bookTour = async (tourId) => {
    // 1. get checkout session
    try {
        const headers = {
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin'
        };
        const url = `/api/v1/bookings/checkout-session/${tourId}`;
        let res = await fetch(url, {
            headers: headers
        });
        res = await res.json();
        if(res.status === 'success') {
            // 2. create checkout form and charge credit card
            const session = res.session;
            await stripe.redirectToCheckout({ sessionId: session.id });
        } else {
            displayAlert('Something went wrong', 'error');
        }
    } catch (err) {
        // console.log(err);
        displayAlert(err, 'error');
    }
};
