/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */

const stripe = Stripe(
  'pk_test_51Oi7DoD34AZsjjj055rr3zuaaU1h5T5c19KyYI0lWDKPw2dKFYG8fXfxiod2M9VxdzZJ2DLJET5LZI5t0o6BsSHq00O8tZFYjw',
);

const bookTour = async (tourId) => {
  try {
    //get checkout session from API booking/:tourId
    const session = await axios({
      method: 'GET',
      url: `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    });

    console.log(session);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert(err);
  }
};

const bookBtn = document.getElementById('book-tour');

bookBtn.addEventListener('click', (e) => {
  e.target.textContent = 'Processing......';

  const tourId = e.target.dataset.tourId;

  bookTour(tourId);
});
