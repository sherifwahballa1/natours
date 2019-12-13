/* eslint-disable */
const updateData = async (data) => {
    try { 
        const res = await axios({
            method: 'PATCH',
            url: '/api/v1/users/updateMe',
            data
        });
        if((res.data.status = 'success')) {
            //location.reload(true);
            setTimeout(function(){
                window.location.reload();
             }, 2000);
            const el = document.querySelector('.alert');
            if(el) el.parentElement.removeChild(el);
            const markup = '<div class="alert alert--success">Data Updated Successfully </div>';
            document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
        }
    } catch (err) {
        const el = document.querySelector('.alert');
        if(el) el.parentElement.removeChild(el);
        const markup = `<div class="alert alert--error">${err.response.data.message}</div>`;
        document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
   }
};

const userDataFrom = document.querySelector('.form-user-data');

if(userDataFrom) userDataFrom.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
     //console.log(form);
   // 
     //const name = document.getElementById('name').value;
     //const email = document.getElementById('email').value;
    // const photo = document.getElementById('photo').files[0];
    
    updateData(form);
});