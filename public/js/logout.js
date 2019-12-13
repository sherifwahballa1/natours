/* eslint-disable */
const logout = async () => {
    try { 
        const res = await axios({
            method: 'GET',
            url: 'http://localhost:3000/api/v1/users/logout'
        });
        if((res.data.status = 'success')) {
            //location.reload(true);
            location.replace('/');
            const el = document.querySelector('.alert');
            if(el) el.parentElement.removeChild(el);
            const markup = '<div class="alert alert--success">Logged Out Successfully </div>';
            document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
        }
    } catch (err) {
        const el = document.querySelector('.alert');
        if(el) el.parentElement.removeChild(el);
        const markup = '<div class="alert alert--error">Error Logging our! try again </div>';
        document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
   }
};

const logOutBtn = document.querySelector('.nav__el--logout');

if(logOutBtn) logOutBtn.addEventListener('click', logout);