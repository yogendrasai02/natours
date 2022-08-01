const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {

    // 1. get currently selected tour
    const tour = await Tour.findById(req.params.tourId);

    // const successURL = `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`;
    const successURL = `${req.protocol}://${req.get('host')}/?alert=booking`;

    // 2. create checkout session
    const session = await stripe.checkout.sessions.create({
        customer_email: req.user.email,
        submit_type: 'pay',
        mode: 'payment',
        success_url: successURL,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        client_reference_id: tour.id,
        line_items: [
            {
                price_data: {
                    currency: 'USD',
                    product_data: {
                        name: tour.name,
                        description: tour.summary,
                        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
                    },
                    unit_amount: tour.price * 100,
                },
                quantity: 1
            }
        ]
    });

    // 3. send it to client
    res.status(200).json({
        status: 'success',
        session: session
    });

});

// WORKAROUND for STRIPE payment, NOT to use in PROD
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     const { tour, user, price } = req.query;
//     if(!tour || !user || !price) {
//         next();
//         return;
//     }
//     const booking = await Booking.create({ tour, user, price });
//     // console.log(req.originalUrl);
//     res.redirect('/');
// });

const createBookingCheckout = async (session) => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.line_items[0].unit_amount / 100;
    await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
    // get the stripe-signature
    const signature = req.headers['stripe-signature'];
    // create a stripe event
    let event = null;
    try {
        event = stripe.webhooks.construct(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send('Webhook error' + err.message);
    }
    if(event.type === 'checkout.session.completed') {
        createBookingCheckout(event.data.object);
    }
    res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);