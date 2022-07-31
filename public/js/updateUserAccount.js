import { displayAlert } from './alerts';
export const updateData = (data, type) => {
    let url = '/api/v1/users';
    if(type === 'data') url += '/updateMe';
    else    url += '/updateMyPassword';
    let headersObj = {};
    if(type !== 'data') {
        // FOR PASSWORD
        headersObj = {
            'Content-type': 'application/json'
        };
        data = JSON.stringify(data);
    }
    fetch(url, {
        method: 'PATCH',
        headers: headersObj,
        body: data
    }).then(res => res.json())
    .then(data => {
        if(data.status !== 'success') {
            displayAlert(data.message, 'error');
        } else {
            displayAlert(`${type.toUpperCase()} updated successfully`, 'success');
        }
    }).catch(err => {
        displayAlert(err.message, 'error');
    });
};