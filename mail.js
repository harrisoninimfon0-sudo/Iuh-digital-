const nodemailer=require("nodemailer");
async function sendMail(to,subject,text){
 if(!process.env.SMTP_HOST)return;
 const transporter=nodemailer.createTransport({
  host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),
  secure:Number(process.env.SMTP_PORT)===465,
  auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}
 });
 await transporter.sendMail({from:process.env.MAIL_FROM,to,subject,text});
}
module.exports={sendMail};