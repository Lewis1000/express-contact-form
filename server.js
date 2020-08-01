const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const request = require('request');
const env = require('dotenv');
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator');

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html']}));

app.post('/contact', [

    // checking inputs given
    check('name').notEmpty().trim().escape().withMessage('Name invalid'),
    check('email').notEmpty().isEmail().normalizeEmail().escape().withMessage('Email invalid'),
    check('message').notEmpty().escape().withMessage('Message invalid')

], (req, res) => {

    // checking if captcha is attempted
    if (
        req.body.captcha === undefined ||
        req.body.captcha === '' ||
        req.body.captcha === null
    ){
        return res.json({'success': false, 'message': 'Please complete captcha'})
    }

    // validating form inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
    } else {
        console.log('Valid inputs');
    }

    // captcha variables
    const secretKey = process.env.SECRET_KEY;
    const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;

    request(verifyUrl, (err, response, body) => {
        body = JSON.parse(body);

        // failed captcha
        if (body.success !== undefined && !body.success) {
            return console.log('captcha failed');
        }

        // completed captcha
        // sending email
        async function main() {

            // creating mail transporter
            let transporter = nodemailer.createTransport({
                service: 'smtp.gmail.com',
                auth: {
                    user: process.env.GMAIL_EMAIL,
                    pass: process.env.GMAIL_PASS
                }
            });

            let info = await transporter.sendMail({
                from: process.env.GMAIL_EMAIL,
                to: 'youremail@email.com',
                subject: 'Website Contact Form',
                text: 'Only support plain text',
                amp: `<!doctype html>
                <html>
                    <head>
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <p>This is the message</p>
                    </body>
                </html>`
            });
        };
        main().catch(console.error);
    });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});