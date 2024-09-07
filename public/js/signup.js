/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};
const showAlert = (type, message) => {
  hideAlert();
  const html = `<div class='alert alert--${type}'>${message}</div>`;

  document.querySelector('body').insertAdjacentHTML('afterbegin', html);

  window.setTimeout(hideAlert, 5000);
};

const signup = async (email, password, confirmpassword, name) => {
  try {
    const result = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/signup',
      data: {
        email: email,
        password: password,
        passwordConfirm: confirmpassword,
        name: name,
      },
    });

    console.log(result);
    if (result.data.status === 'success') {
      showAlert('success', 'Sign up successfully!!');

      window.setTimeout(() => location.assign('/'), 1000);
    }
  } catch (err) {
    // alert(err.response.data.message);
    showAlert('error', err.response.data.message);
  }
};

if (document.querySelector('.signup--login')) {
  document.querySelector('.signup--login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmpassword = document.getElementById('confirmpassword').value;
    const name = document.getElementById('username').value;

    signup(email, password, confirmpassword, name);
  });
}
