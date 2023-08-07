const nodemailer = require('nodemailer');


exports.sendEmail = async (options) => {

    var transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "0c5c0bf4eb92e8",
          pass: "481bbd988f4e50"
        }
      });


    const mailoptions = {
        from: process.env.SMTP_MAIL,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(mailoptions);

};