const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// In-memory store for OTPs
let otpStore = {}; // In-memory OTP store

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Replace with your email service provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Endpoint to handle event notifications
app.post('/api/upload-event', async (req, res) => {
  const { eventName, eventDate, deadlineDate, eventTime, emails } = req.body;

  // Format the dates and time
  const formattedEventDate = formatDate(eventDate);
  const formattedDeadlineDate = formatDate(deadlineDate);
  const formattedEventTime = formatTime(eventTime);

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails.join(', '),
      subject: `Upcoming Event: ${eventName}`,
      html: `
          <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; max-width: 600px; margin: auto; border-radius: 8px; border: 1px solid #ddd;">
            <div style="text-align: center; padding-bottom: 20px;">
              <h1 style="color: #ff6600; margin-bottom: 10px;">${eventName}</h1>
              <p style="font-size: 18px; color: #666;">You are invited to our upcoming event!</p>
            </div>
            <div style="padding: 10px 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #ff6600; font-size: 24px; margin-bottom: 15px;">Event Details</h2>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedEventDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedEventTime}</p>
              <p style="margin: 5px 0;"><strong>Registration Deadline:</strong> ${formattedDeadlineDate}</p>
            </div>
            <div style="text-align: center; padding-top: 20px;">
              <p style="font-size: 14px; color: #999;">Thank you for your attention! We look forward to seeing you at the event.</p>
              <p style="font-size: 14px; color: #999;">If you have any questions, feel free to contact us at <a href="mailto:sijgeriaucssangha@gmail.com" style="color: #ff6600;">sijgeriaucssangha@gmail.com</a>.</p>
            </div>
          </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Notifications sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending notifications.');
  }
});

// Additional endpoint to handle event deletion notifications
app.post('/api/delete-event', async (req, res) => {
  const { eventName, eventDate, eventTime, deadlineDate, emails } = req.body;

  try {
    // Format the dates and time
    const formattedEventDate = formatDate(eventDate);
    const formattedEventTime = formatTime(eventTime);
    const formattedDeadlineDate = formatDate(deadlineDate);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails.join(', '),
      subject: `Event Deleted: ${eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; max-width: 600px; margin: auto; border-radius: 8px; border: 1px solid #ddd;">
          <div style="text-align: center; padding-bottom: 20px;">
            <h1 style="color: #ff6600; margin-bottom: 10px;">Event Deleted</h1>
            <p style="font-size: 18px; color: #666;">We're sorry to inform you that an event you were interested in has been deleted.</p>
          </div>
          <div style="padding: 10px 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #ff6600; font-size: 24px; margin-bottom: 15px;">Event Details</h2>
            <p style="margin: 5px 0;"><strong>Event Name:</strong> ${eventName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedEventDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedEventTime}</p>
            <p style="margin: 5px 0;"><strong>Registration Deadline:</strong> ${formattedDeadlineDate}</p>
          </div>
          <div style="text-align: center; padding-top: 20px;">
            <p style="font-size: 14px; color: #999;">Thank you for your understanding.</p>
            <p style="font-size: 14px; color: #999;">If you have any questions, feel free to contact us at <a href="mailto:sijgeriaucssangha@gmail.com" style="color: #ff6600;">sijgeriaucssangha@gmail.com</a>.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Notification sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending notification.');
  }
});

// Endpoint to send OTP for deletion
app.post('/api/deletion-otp', async (req, res) => {
  const { email, participantId } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP

  otpStore[email] = { otp, participantId, timestamp: Date.now() };

  // Send OTP email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code for Deleting Participation',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333;">Dear User,</h2>
          <p style="color: #555;">
            You have requested to delete your participation. Please use the following OTP to confirm the deletion:
          </p>
          <h3 style="color: #007bff; font-size: 24px;">${otp}</h3>
          <p style="color: #555;">
            This OTP is valid for the next 5 minutes.
          </p>
          <p style="color: #333;">
            If you did not request this OTP, please ignore this email.
          </p>
          <hr style="border: 1px solid #e0e0e0; margin-top: 20px; margin-bottom: 20px;" />
          <p style="text-align: center; color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} SUCSS. All rights reserved.
          </p>
        </div>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('OTP sent successfully.');
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).send('Error sending OTP.');
  }
});

// Endpoint to verify OTP and delete participant
app.post('/api/verify-deletion-otp', (req, res) => {
  const { email, otp } = req.body;

  const otpEntry = otpStore[email];
  if (otpEntry && otpEntry.otp === otp && Date.now() - otpEntry.timestamp < 5 * 60 * 1000) { // 5 minutes validity
    delete otpStore[email]; // Clear OTP after verification

    // Proceed with participant deletion
    // Assume you have a function deleteParticipant that takes participantId
    // await deleteParticipant(otpEntry.participantId);

    res.status(200).send('OTP verified successfully. Participant deleted.');
  } else {
    res.status(400).send('Invalid OTP or OTP expired.');
  }
});

// Endpoint to send OTP
app.post('/api/send-otp', async (req, res) => {
  const { email, name, eventName, eventDate, eventTime } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP

  otpStore[email] = { otp, timestamp: Date.now() };

  // Format the event date to dd/mm/yyyy
  const formattedEventDate = new Date(eventDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Format the event time to hh:mm AM/PM
  const formattedEventTime = new Date(`1970-01-01T${eventTime}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code for Event Participation',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333;">Dear ${name},</h2>
          <p style="color: #555;">
            You are about to participate in the following event:
          </p>
          <p style="color: #333; font-size: 16px;">
            <strong>Event Name:</strong> ${eventName}<br />
            <strong>Event Date:</strong> ${formattedEventDate}<br />
            <strong>Event Time:</strong> ${formattedEventTime}
          </p>
          <p style="color: #555;">
            Please use the following OTP to complete your registration:
          </p>
          <h3 style="color: #007bff; font-size: 24px;">${otp}</h3>
          <p style="color: #555;">
            This OTP is valid for the next 5 minutes.
          </p>
          <p style="color: #333;">
            If you did not request this OTP, please ignore this email.
          </p>
          <hr style="border: 1px solid #e0e0e0; margin-top: 20px; margin-bottom: 20px;" />
          <p style="text-align: center; color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} SUCSS. All rights reserved.
          </p>
        </div>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('OTP sent successfully.');
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).send('Error sending OTP.');
  }
});

// Endpoint to verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  const otpEntry = otpStore[email];
  if (otpEntry && otpEntry.otp === otp && Date.now() - otpEntry.timestamp < 5 * 60 * 1000) { // 5 minutes validity
    delete otpStore[email]; // Clear OTP after verification
    res.status(200).send('OTP verified successfully.');
  } else {
    res.status(400).send('Invalid OTP or OTP expired.');
  }
});

// Endpoint to send a notification after successful participation
app.post('/api/successful-notify', async (req, res) => {
  const { email, name, eventName, eventDate, eventTime } = req.body;

  // Format the event date to dd/mm/yyyy
  const formattedEventDate = new Date(eventDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Format the event time to hh:mm AM/PM
  const formattedEventTime = new Date(`1970-01-01T${eventTime}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Participation Successful: Event Confirmation',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333;">Dear ${name},</h2>
          <p style="color: #555;">
            Your participation in the following event has been successfully recorded:
          </p>
          <p style="color: #333; font-size: 16px;">
            <strong>Event Name:</strong> ${eventName}<br />
            <strong>Event Date:</strong> ${formattedEventDate}<br />
            <strong>Event Time:</strong> ${formattedEventTime}
          </p>
          <p style="color: #555;">
            Thank you for your registration! We look forward to seeing you at the event.
          </p>
          <hr style="border: 1px solid #e0e0e0; margin-top: 20px; margin-bottom: 20px;" />
          <p style="text-align: center; color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} SUCSS. All rights reserved.
          </p>
        </div>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Participation notification sent successfully.');
  } catch (error) {
    console.error('Error sending participation notification:', error);
    res.status(500).send('Error sending participation notification.');
  }
});

// New endpoint to send a success notification after deletion
app.post('/api/deletion-success', async (req, res) => {
  const { email, name, eventName, eventDate, eventTime } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Successful Deletion Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333;">Dear ${name},</h2>
        <p style="color: #555;">
          We are writing to confirm that your request for deletion has been successfully processed.
        </p>
        <p style="color: #555;">
          Here are the details of the event you were registered for:
        </p>
        <div style="padding: 10px 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #ff6600; font-size: 20px;">Event Details</h3>
          <p><strong>Event Name:</strong> ${eventName}</p>
          <p><strong>Date:</strong> ${formatDate(eventDate)}</p>
          <p><strong>Time:</strong> ${formatTime(eventTime)}</p>
        </div>
        <p style="color: #555;">
          If you have any questions or need further assistance, please feel free to contact us.
        </p>
        <hr style="border: 1px solid #e0e0e0; margin-top: 20px; margin-bottom: 20px;" />
        <p style="text-align: center; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} SUCSS. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Deletion success notification sent successfully.');
  } catch (error) {
    console.error('Error sending deletion success notification:', error);
    res.status(500).send('Error sending deletion success notification.');
  }
});

// New endpoint to handle individual event notifications
app.post('/api/notify', async (req, res) => {
  const { email, name, eventName, eventDate, eventTime } = req.body;

  // Format the event date to dd/mm/yyyy
  const formattedEventDate = new Date(eventDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Format the event time to hh:mm AM/PM
  const formattedEventTime = new Date(`1970-01-01T${eventTime}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Remider about Upcoming Event: ${eventName}`,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; max-width: 600px; margin: auto; border-radius: 8px; border: 1px solid #ddd;">
          <div style="text-align: center; padding-bottom: 20px;">
            <h1 style="color: #ff6600; margin-bottom: 10px;">${eventName}</h1>
            <p style="font-size: 18px; color: #666;">You are invited to our upcoming event! as you have participated in the ${eventName}</p>
          </div>
          <div style="padding: 10px 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #ff6600; font-size: 24px; margin-bottom: 15px;">Event Details</h2>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedEventDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedEventTime}</p>
          </div>
          <div style="text-align: center; padding-top: 20px;">
            <p style="font-size: 14px; color: #999;">Thank you for your attention! We look forward to seeing you at the event.</p>
            <p style="font-size: 14px; color: #999;">If you have any questions, feel free to contact us at <a href="mailto:sijgeriaucssangha@gmail.com" style="color: #ff6600;">sijgeriaucssangha@gmail.com</a>.</p>
          </div>
        </div>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Notification sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending notifications.');
  }
});

// New endpoint to handle account deactivation notifications
// New endpoint to handle account deactivation notifications
app.post('/api/deactivate-account', async (req, res) => {
  const { email, name, reason } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Account Suspension Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333;">Dear ${name},</h2>
        <p style="color: #555;">
          We regret to inform you that your account has been suspended for a limited time period. The reason for this action is as follows:
        </p>
        <p style="color: #333; font-size: 16px;">
          <strong>Reason:</strong> ${reason}
        </p>
        <p style="color: #555;">
          Whenever your account is reactivated, we will inform you via email.
        </p>
        <p style="color: #555;">
          If you believe this is a mistake or if you have any questions, please contact us at <a href="mailto:sijgeriaucssangha@gmail.com" style="color: #ff6600;">sijgeriaucssangha@gmail.com</a>.
        </p>
        <p style="color: #555;">
          We appreciate your attention to this matter.
        </p>
        <hr style="border: 1px solid #e0e0e0; margin-top: 20px; margin-bottom: 20px;" />
        <p style="text-align: center; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} SUCSS. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Account deactivation notification sent successfully.');
  } catch (error) {
    console.error('Error sending account deactivation notification:', error);
    res.status(500).send('Error sending account deactivation notification.');
  }
});

// New endpoint to handle account reactivation notifications
app.post('/api/activate-account', async (req, res) => {
  const { email, name } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Account Reactivation Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333;">Dear ${name},</h2>
        <p style="color: #555;">
          We are pleased to inform you that your account has been reactivated. You can now log in and resume using our services.
        </p>
        <p style="color: #555;">
          If you have any questions or need further assistance, please contact us at <a href="mailto:sijgeriaucssangha@gmail.com" style="color: #ff6600;">sijgeriaucssangha@gmail.com</a>.
        </p>
        <p style="color: #555;">
          We appreciate your continued trust in our service.
        </p>
        <hr style="border: 1px solid #e0e0e0; margin-top: 20px; margin-bottom: 20px;" />
        <p style="text-align: center; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} SUCSS. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Account reactivation notification sent successfully.');
  } catch (error) {
    console.error('Error sending account reactivation notification:', error);
    res.status(500).send('Error sending account reactivation notification.');
  }
});

// Endpoint to approve membership
app.post('/api/approve-membership', async (req, res) => {
  const { email, name, photoUrl, membershipCode } = req.body;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Membership Approved',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; max-width: 600px; margin: auto; border-radius: 8px; border: 1px solid #ddd;">
          <div style="text-align: center; padding-bottom: 20px;">
            <h1 style="color: #28a745; margin-bottom: 10px;">Membership Approved</h1>
            <p style="font-size: 18px; color: #666;">Congratulations, ${name}!</p>
            <img src="${photoUrl}" alt="Profile Picture" style="border-radius: 50%; width: 100px; height: 100px; object-fit: cover;"/>
          </div>
          <div style="padding: 10px 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="margin: 5px 0;">Your membership application has been approved. You are now officially a member.</p>
            <p style="margin: 5px 0;"><strong>Membership Code:</strong> ${membershipCode}</p>
          </div>
          <div style="text-align: center; padding-top: 20px;">
            <p style="font-size: 14px; color: #999;">Thank you for your patience and welcome to the community!</p>
            <p style="font-size: 14px; color: #999;">If you have any questions, feel free to contact us at <a href="mailto:sijgeriaucssangha@gmail.com" style="color: #28a745;">sijgeriaucssangha@gmail.com</a>.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Membership approval email sent successfully.');
  } catch (error) {
    console.error('Error sending approval email:', error);
    res.status(500).send('Error sending approval email.');
  }
});

// Endpoint to decline membership
app.post('/api/decline-membership', async (req, res) => {
  const { email, name, photoUrl } = req.body;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Membership Declined',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px; max-width: 600px; margin: auto; border-radius: 8px; border: 1px solid #ddd;">
          <div style="text-align: center; padding-bottom: 20px;">
            <h1 style="color: #dc3545; margin-bottom: 10px;">Membership Declined</h1>
            <p style="font-size: 18px; color: #666;">Dear ${name},</p>
            <img src="${photoUrl}" alt="Profile Picture" style="border-radius: 50%; width: 100px; height: 100px; object-fit: cover;"/>
          </div>
          <div style="padding: 10px 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="margin: 5px 0;">We regret to inform you that your membership application has been declined.</p>
            <p style="margin: 5px 0;">If you have any questions or wish to reapply, please contact us at <a href="mailto:sijgeriaucssangha@gmail.com" style="color: #dc3545;">sijgeriaucssangha@gmail.com</a>.</p>
          </div>
          <div style="text-align: center; padding-top: 20px;">
            <p style="font-size: 14px; color: #999;">Thank you for your interest.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Membership decline email sent successfully.');
  } catch (error) {
    console.error('Error sending decline email:', error);
    res.status(500).send('Error sending decline email.');
  }
});

// API Endpoint to Send Email
app.post('/api/send-contact-email', (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `New message from ${name}`,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ status: 'fail', message: 'Error sending email' });
    }
    console.log('Email sent: ' + info.response);
    res.status(200).json({ status: 'success', message: 'Email sent successfully' });
  });
});


app.post('/api/verified', async (req, res) => {
  const { email, name } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification Successful - Unlock Exclusive Benefits!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333;">Dear ${name},</h2>
        <p style="color: #555;">
          Congratulations! Your email has been successfully verified. As a verified user, you can now enjoy full access to all our features and services.
        </p>
        <h3 style="color: #333;">Exclusive Advantages for Verified Users:</h3>
        <ul style="color: #555; padding-left: 20px;">
          <li style="margin-bottom: 10px;">1. <strong>Extended Participation Window:</strong> You can get an extra day to participate in events even after the deadline date has passed.</li>
          <li style="margin-bottom: 10px;">2. <strong>Flexible Withdrawal Options:</strong> You can delete your participation up to 2 hours before an event, whereas other users can only withdraw their participation up to 1 day before the event.</li>
        </ul>
        <p style="color: #555;">
          These benefits are our way of saying thank you for verifying your email. Enjoy your enhanced experience!
        </p>
        <p style="color: #555;">
          If you have any questions, please feel free to reach out to us at 
          <a href="mailto:sijgeriaucssangha@gmail.com" style="color: #ff6600;">sijgeriaucssangha@gmail.com</a>.
        </p>
        <p style="color: #555;">
          Thank you for verifying your email!
        </p>
        <hr style="border: 1px solid #e0e0e0; margin-top: 20px; margin-bottom: 20px;" />
        <p style="text-align: center; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} SUCSS. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Verification success email sent successfully.');
  } catch (error) {
    console.error('Error sending verification success email:', error);
    res.status(500).send('Error sending verification success email.');
  }
});

app.post('/api/unverified', async (req, res) => {
  const { email, name, reason } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification Failed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333;">Dear ${name},</h2>
        <p style="color: #555;">
          Unfortunately, your email verification attempt has failed. The reason for this failure is as follows:
        </p>
        <p style="color: #333; font-size: 16px;">
          <strong>Reason:</strong> ${reason}
        </p>
        <p style="color: #555;">
          Please try verifying your email again. If you continue to experience issues, feel free to contact our support team at 
          <a href="mailto:sijgeriaucssangha@gmail.com" style="color: #ff6600;">sijgeriaucssangha@gmail.com</a>.
        </p>
        <p style="color: #555;">
          We apologize for the inconvenience.
        </p>
        <hr style="border: 1px solid #e0e0e0; margin-top: 20px; margin-bottom: 20px;" />
        <p style="text-align: center; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} SUCSS. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Verification failure email sent successfully.');
  } catch (error) {
    console.error('Error sending verification failure email:', error);
    res.status(500).send('Error sending verification failure email.');
  }
});


// Helper function to format dates
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Helper function to format time
function formatTime(time) {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
