/* eslint-disable no-undef */

const sumbitForm = document.querySelector('.form-user-data');
const passwordForm = document.querySelector('.form-user-settings');

const UpdateMe = async (form) => {
  try {
    const result = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updateme',
      data: form,
    });

    if (result.data.status === 'success') {
      showAlert('success', 'Data Updated successfully!');
      window.location.reload();
    }
    console.log(result);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

if (sumbitForm) {
  sumbitForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // const user = document.getElementById('name').value;
    // const email = document.getElementById('email').value;

    //这里相当于上面的代码
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    UpdateMe(form);
  });
}

const updatePassword = async (
  currentPassword,
  newPassword,
  confirmPassword,
) => {
  try {
    const result = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updatepassword',
      data: {
        passwordCurrent: currentPassword,
        updatePassword: newPassword,
        passwordConfirm: confirmPassword,
      },
    });

    console.log(result);
    if (result.data.status === 'success') {
      showAlert('success', 'Password Updated successfully!');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;

    document.querySelector('.btn--save--password').textContent = 'Updating...';

    await updatePassword(currentPassword, newPassword, confirmPassword);

    // window.location.reload();

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';

    document.querySelector('.btn--save--password').textContent =
      'SAVE PASSWORD';
  });
}
