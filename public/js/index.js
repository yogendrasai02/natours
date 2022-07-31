import { login, logout } from './login';
import { renderMap } from './map_leaflet';
import { updateData } from './updateUserAccount';
import { bookTour } from './stripe';

import '@babel/polyfill';

const loginForm = document.getElementById('user-login-form');
const mapDiv = document.getElementById('map');
const logoutBtn = document.querySelector('.nav__el--logout');
const userAccountUpdateForm = document.querySelector('.form-user-data');
const userPasswordUpdateForm = document.querySelector('.form-user-password');
const bookTourBtn = document.getElementById('bookTourBtn');


if(mapDiv) {
    const locations = JSON.parse(mapDiv.dataset.locations);
    renderMap(locations);
}

if(loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
}

if(logoutBtn) {
    logoutBtn.addEventListener('click', e => {
        logout();
    });
}

if(userAccountUpdateForm) {
    userAccountUpdateForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const photo = document.getElementById('photo').files[0];

        const form = new FormData();
        form.append('name', name);
        form.append('email', email);
        form.append('photo', photo);

        updateData(form, 'data');
        // RELOAD THE PAGE TO SEE THE CHANGES
    });
}

if(userPasswordUpdateForm) {
    userPasswordUpdateForm.addEventListener('submit', e => {
        e.preventDefault();
        const currentPassword = document.getElementById('password-current').value;
        const newPassword = document.getElementById('password').value;
        const newPasswordConfirm = document.getElementById('password-confirm').value;
        updateData({ currentPassword, newPassword, newPasswordConfirm }, 'password');
        // reset form (remove the passwords from UI)
        userPasswordUpdateForm.reset();
    });
}

if(bookTourBtn) {
    bookTourBtn.addEventListener('click', e => {
        // console.log(e);
        const tourId = e.target.dataset.tourId;
        bookTour(tourId);
    });
}