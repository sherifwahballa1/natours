/* eslint-disable */
const stripe = Stripe('pk_test_qaIZJnh2o3YwHe86E8e1xZsE00qblww6mk');

const bookTour = async tourId => {
    try {
    //1) Get checkout session from API
    const session = await axios(`http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
    //2) create checkout from + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    } catch(err) {
        const el = document.querySelector('.alert');
        if (el) el.parentElement.removeChild(el);
        const markup = `<div class="alert alert--error">${err.response.data.message}</div>`;
        document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
    }
}

const bookBtn = document.getElementById('book-tour');

if (bookBtn)
{
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...';
        const tourId = e.target.dataset.tourId;
        bookTour(tourId);
    });
}