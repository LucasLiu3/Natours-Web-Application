/* eslint-disable no-restricted-globals */
/* eslint-disable no-alert */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-undef */
/* eslint-disable*/

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

const login = async (email, password) => {
  try {
    const result = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
    });

    console.log(result);
    if (result.data.status === 'success') {
      showAlert('success', 'Logged in successfully!!');

      window.setTimeout(() => location.assign('/'), 1000);
    }
  } catch (err) {
    // alert(err.response.data.message);
    showAlert('error', err.response.data.message);
  }
};

if (document.querySelector('.form--login')) {
  document.querySelector('.form--login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

const logout = async () => {
  try {
    console.log('This is the begin');
    const result = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });

    if (result.data.status === 'success') {
      //   location.reload(true);
      window.setTimeout(() => location.assign('/'), 1000);
    }
  } catch (err) {
    console.log(err);
    // showAlert('error', 'Why is always error');
  }
};

const logoutBtn = document.querySelector('.nav__el--logout');

if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    logout();
  });
}
