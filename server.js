// *** For ENVIRONMENT VARIABLES ***
const dotenv = require('dotenv');
dotenv.config({
    path: './config.env'
});

// *** to handle UNCAUGHT EXCEPTIONS (last safety net) ***
process.on('uncaughtException', err => {
    console.log('💥 Uncaught Exception: Shutting down the app..... 💥');
    console.log(err);
    console.log(err.name);
    console.log(err.message);
    // you SHOULD terminate the app immediately
    process.exit(1);
});

const app = require('./app');
const mongoose = require('mongoose');

// Start the server at the given port
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}👍`);
});

// *** MONGOOSE ***
// connect to DB
const DB = process.env.DB_URL.replace('<password>', process.env.DB_PASSWORD);
mongoose
    .connect(DB)
    .then(conn => {
        console.log('Connected to DB successfully👍');
    });

// console.log(thisDoesntExist);

// *** Handle UNHANDLED PROMISE REJECTIONS ***
process.on('unhandledRejection', err => {
    console.log('💥 Unhandled Rejection: Shutting down the app..... 💥');
    console.log(err);
    console.log(err.name);
    console.log(err.message);
    // gracefully close the server, then shutdown the app
    // (optional to terminate or not)
    server.close(() => {
        process.exit(1);
    });
});

// ** handle SIGTERM sent by HEROKU (dynos restart every 24 hours) **
process.on('SIGTERM', () => {
    console.log('✌️SIGTERM RECEIVED, gracefully shutting down the app...');
    server.close(() => {
        console.log('💥Process Terminated...');
    });
});