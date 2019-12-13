const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `SHerifWahballa <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        service: 'SendGrid',
        port: 25,
        secure: false,
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // send the actual email
  async send(template, subject) {
    //1) Render HTML based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });
    //2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: htmlToText.fromString(html)
      // html:
    };

    //3) Create a tranport and send email
    await this.newTransport().sendMail(mailOptions, function(error, response) {
      if (error) {
        console.log(error);
      }
    });
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your Password reset token (valid for only 10 minutes'
    );
  }
};
