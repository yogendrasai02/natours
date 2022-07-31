// *** For ENVIRONMENT VARIABLES ***
const dotenv = require('dotenv');
dotenv.config({
    path: './config.env'
});

const fs = require('fs');

const Tour = require('./../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

const mongoose = require('mongoose');

// *** MONGOOSE ***
// connect to DB
const DB = process.env.DB_URL.replace('<password>', process.env.DB_PASSWORD);
mongoose
    .connect(DB)
    .then(conn => {
        console.log('Connected to DB successfully👍');
    })
    .catch(err => {
        console.log('Error while connecting to Mongoose💥');
        console.log(err);
    });

// *** DELETE existing data in DB ***
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await Review.deleteMany();
        await User.deleteMany();
        console.log('Exisiting data deleted successfully👍');
    } catch(err) {
        console.log(err);
    }
    process.exit();
};

// read data from .json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// *** ADD data to DB ***
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Data imported to DB successfully👍');
    } catch(err) {
        console.log(err);
    }
    process.exit();
};

if(process.argv[2] === '--import') {
    importData();
} else if(process.argv[2] === '--delete') {
    deleteData();
} else {
    console.log('Script terminated because of invalid option💥');
    process.exit();
}