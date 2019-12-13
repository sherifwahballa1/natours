/* eslint-disable */
const updatePassword = async (passwordCurrent, password, passwordConfirm) => {
    try { 
        const res = await axios({
            method: 'PATCH',
            url: 'http://localhost:3000/api/v1/users/updatePassword',
            data: {
                passwordCurrent,
                password,
                passwordConfirm
            }
        });
        if((res.data.status = 'success')) {
            setTimeout(function(){
                window.location.reload();
             }, 1000);
            const el = document.querySelector('.alert');
            if(el) el.parentElement.removeChild(el);
            const markup = '<div class="alert alert--success">Password Updated Successfully </div>';
            document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
        }
    } catch (err) {
        const el = document.querySelector('.alert');
        if(el) el.parentElement.removeChild(el);
        const markup = `<div class="alert alert--error">${err.response.data.message}</div>`;
        document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
   }
};

const userPasswordFrom = document.querySelector('.form-user-password');

if(userPasswordFrom) userPasswordFrom.addEventListener('submit', async e => {
    e.preventDefault();
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updatePassword(passwordCurrent, password, passwordConfirm);
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
});