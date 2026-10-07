const BASE="https://api.paystack.co";
async function request(path,options={}){
 const r=await fetch(BASE+path,{...options,headers:{
  "Authorization":`Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  "Content-Type":"application/json",...(options.headers||{})
 }});
 const d=await r.json();
 if(!r.ok||!d.status)throw new Error(d.message||"Paystack request failed");
 return d.data;
}
async function initialize({reference,amount,email,currency,callbackUrl,metadata}){
 return request("/transaction/initialize",{method:"POST",body:JSON.stringify({
  reference,amount:String(amount),email,currency,callback_url:callbackUrl,metadata
 })});
}
async function verify(reference){return request(`/transaction/verify/${encodeURIComponent(reference)}`)}
async function refund(transactionId,amount,reason){
 return request(`/refund`,{method:"POST",body:JSON.stringify({
  transaction:transactionId,amount:String(amount),customer_note:reason,merchant_note:reason
 })});
}
function verifyWebhook(raw,signature){
 const crypto=require("crypto");
 const hash=crypto.createHmac("sha512",process.env.PAYSTACK_SECRET_KEY).update(raw).digest("hex");
 return !!signature && crypto.timingSafeEqual(Buffer.from(hash),Buffer.from(signature));
}
module.exports={initialize,verify,refund,verifyWebhook};