/* eslint-disable no-alert */
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
