const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_SERVICE_SENDER_EMAIL,
        pass: process.env.EMAIL_SERVICE_SENDER_PASSWORD
    }
});

const sendEmail = (mailOptions) => {
    transporter.sendMail(mailOptions, (err, info) => {
        if (err)
            console.log(err);
        else
            console.log('Email Send : ', info.response);
    });
}

const sendSignUpEmail = (name, email) => {
    sendEmail({
        from: `Task Manager <${process.env.EMAIL_SERVICE_SENDER_EMAIL}>`,
        to: email,
        subject: 'Welcome to Task Manager',
        html: `
            <p>Hi ${name},</p>
            <p>We hope you will have wonderful experience here 😁</p>
            <br>
            Regards,<br>
            Janvi Shah
        `
    });
}

module.exports = {
    sendSignUpEmail
};