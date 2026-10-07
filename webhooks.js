const express=require("express"),pool=require("../db"),{provider}=require("../providers"),{sendMail}=require("../mail");
const router=express.Router();
router.post("/paystack",express.raw({type:"application/json"}),async(req,res)=>{
 try{
  const signature=req.get("x-paystack-signature");
  if(!provider().verifyWebhook(req.body,signature))return res.status(401).send("invalid signature");
  const event=JSON.parse(req.body.toString("utf8"));
  const eventId=event?.data?.id?String(event.data.id):`${event.event}:${event?.data?.reference||Date.now()}`;
  const inserted=await pool.query(`INSERT INTO webhook_events(provider,event_id,payload)
    VALUES('paystack',$1,$2) ON CONFLICT(provider,event_id) DO NOTHING RETURNING id`,[eventId,event]);
  if(!inserted.rows.length)return res.sendStatus(200);
  if(event.event==="charge.success"){
   const d=event.data;
   const t=(await pool.query("SELECT * FROM transactions WHERE reference=$1",[d.reference])).rows[0];
   if(t && Number(d.amount)===Number(t.amount) && d.currency===t.currency){
    await pool.query("UPDATE transactions SET status='successful',provider_reference=$1,paid_at=COALESCE(paid_at,NOW()),updated_at=NOW() WHERE id=$2",[String(d.id),t.id]);
    await sendMail(t.customer_email,"IUH DIGITAL payment successful",`Payment ${t.reference} was successful.`);
   }
  }
  res.sendStatus(200);
 }catch(e){console.error(e);res.sendStatus(500)}
});
module.exports=router;