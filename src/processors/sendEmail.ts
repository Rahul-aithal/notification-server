import nodemailer from "nodemailer";
import { type emailType } from "../schema/zod/email.schema";

async function sendEmail(
  data: emailType,
  sentiment: "positive" | "negative"
): Promise<boolean> {
  // Create a transporter
 
  
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_GMAIL_PASS,
    },
  });

  // Choose colors and emoji based on sentiment
  const themeColor = sentiment === "positive" ? "#4CAF50" : "#2196F3";
  const emoji = sentiment === "positive" ? "🎉" : "📢";
  const buttonText = sentiment === "positive" ? "Learn More" : "See Details";
  const headerText = sentiment === "positive" ? "Great News!" : "Important Update";

  // Create HTML email template
  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headerText}</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .header {
        background-color: ${themeColor};
        color: white;
        padding: 20px;
        text-align: center;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        margin-bottom: 20px;
      }
      .content {
        padding: 0 20px 20px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 12px;
        color: #999;
        padding: 20px;
        border-top: 1px solid #eee;
      }
      .button {
        display: inline-block;
        background-color: ${themeColor};
        color: white;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 4px;
        margin-top: 15px;
      }
      .message-box {
        background-color: #f8f9fa;
        border-left: 4px solid ${themeColor};
        padding: 15px;
        margin: 20px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${emoji} ${headerText}</h1>
      </div>
      <div class="content">
        <p>${sentiment === "positive" ? "Hello" : "Dear"} <strong>${data.name}</strong>,</p>
        
        <div class="message-box">
          <p>${data.message}</p>
        </div>
        
        <p>${sentiment === "positive" ? 
          "We're thrilled to share this exciting news with you and look forward to your response!" : 
          "We appreciate your attention to this matter and are available if you have any questions."}</p>
        
        <center><a href="https://ink-well-client.vercel.app/" class="button">${buttonText}</a></center>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} InkWell. All rights reserved.</p>
        <p>If you have any questions, please contact us at aithalrahul34@gmail.com</p>
      </div>
    </div>
  </body>
  </html>
  `;

  // Email options
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: data.email,
    subject: sentiment === "positive" ? "Great News!" : "Important Update",
    text: `${sentiment === "positive" ? "Hello" : "Dear"} ${data.name}, 
           ${data.message}`,
    html: htmlBody
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export default sendEmail;