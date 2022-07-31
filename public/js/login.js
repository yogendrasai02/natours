import { displayAlert } from './alerts';
export const login = (email, password) => {
    const payload = {
        email, password
    };
    const url = '/api/v1/users/login';
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        // console.log(data);
        if(data.status === 'success') {
            displayAlert('Logged in successfully', 'success');
            location.assign('/');   // redirects to homepage
        } else {
            displayAlert(data.message, 'error');
        }
    }).catch(err => {
        alert("Some Error has occured, please try after sometime");
    });
};

export const logout = () => {
    const url = '/api/v1/users/logout';
    fetch(url)
        .then(res => res.json())
        .then(data => {
            location.assign('/');
        })
        .catch(err => {
            displayAlert(err.message, 'error');
        })
};