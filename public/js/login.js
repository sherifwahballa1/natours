/* eslint-disable */
const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login', //'http://localhost:3000/api/v1/users/login'
            data: {
                email,
                password
            }
        });

        if (res.data.status === 'success') {
            const el = document.querySelector('.alert');
            if (el) el.parentElement.removeChild(el);
            const markup = '<div class="alert alert--success">Logged in successfully</div>';
            document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
            //alert('Logged in successfully');
            window.setTimeout(() => {
                location.assign('/')
            }, 1500);
        }
    } catch (err) {
        const el = document.querySelector('.alert');
        if (el) el.parentElement.removeChild(el);
        const markup = `<div class="alert alert--error">${err.response.data.message}</div>`;
        document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
        //alert(err.response.data.message);
    }

};

document.querySelector('.form--login').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
});