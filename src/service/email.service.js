const nodemailer = require('nodemailer');
const User = require('../models/User');

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
            Pratik Kale
        `
    });
}

const sendReleaseNotification = async (release) => {
    const users = await User.find();

    users.forEach(user => {
        sendEmail({
            from: `Task Manager <${process.env.EMAIL_SERVICE_SENDER_EMAIL}>`,
            to: user.email,
            subject: `Realse ${release.version}`,
            html: `
                <p>Hi ${user.name},</p>
                <p>We hope you are having a wonderful experience here 😁</p>
                <p>This email is to notify that our new version ${release.version} has now been released with ${release.description}. Do check out our new features and stay tuned.</p>
                <br>
                Regards,<br>
                Pratik Kale
            `
        });
    });
}

module.exports = {
    sendSignUpEmail,
    sendReleaseNotification
};