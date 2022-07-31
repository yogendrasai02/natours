const nodemailer = require('nodemailer');
const catchAsync = require('./catchAsync');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.firstName = user.name.split(' ')[0];
        this.to = user.email;
        this.from = `Natours <${process.env.EMAIL_FROM}>`;
        this.url = url;
    }

    createNewTransporter() {
        if(process.env.NODE_ENV === 'production') {
            // SEND REAL EMAIL using SENDGRID
            const transporter = nodemailer.createTransport({
                host: 'smtp-relay.sendinblue.com',
                port: 587,
                auth: {
                    user: 'yogendrasai02@gmail.com',
                    pass: 'TFB2YnE53U7WRGaP'
                }
            });
            return transporter;
        }
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        return transporter;
    }

    async send(template, subject) {
        // 1. render HTML from a pug template
        let html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
            subject: subject,
            url: this.url,
            firstName: this.firstName
        });
        // 2. define email options
        const emailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            html: html,
            text: htmlToText(html)
        };
        // 3. create a transporter and send email
        await this.createNewTransporter().sendMail(emailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to Natours');
    }

    async sendPasswordReset() {
        await this.send('resetPassword', 'Your Password Reset Token');
    }

};

const sendEmail = catchAsync(async options => {
    
    // 3. actually send the email
    await transporter.sendMail(emailOptions);
    
});

// module.exports = sendEmail;