const express=require("express"),{v4:uuidv4}=require("uuid");
const pool=require("../db"),{requireApiKey}=require("../middleware/apiKey"),{provider}=require("../providers");
const router=express.Router();router.use(requireApiKey);

router.post("/",async(req,res,next)=>{
 try{
  const{amount,currency="NGN",customer,callbackUrl,metadata={}}=req.body;
  if(!Number.isInteger(Number(amount))||Number(amount)<=0)return res.status(400).json({success:false,error:"amount must be a positive integer in minor units"});
  if(!customer?.email)return res.status(400).json({success:false,error:"customer.email is required"});
  const reference=`IUH-${Date.now()}-${uuidv4().slice(0,8).toUpperCase()}`;
  const p=provider();
  const checkout=await p.initialize({reference,amount:Number(amount),email:customer.email,currency,callbackUrl,metadata});
  const r=await pool.query(`INSERT INTO transactions(customer_id,reference,amount,currency,customer_email,customer_name,status,provider,provider_reference,checkout_url,metadata)
   VALUES($1,$2,$3,$4,$5,$6,'pending','paystack',$2,$7,$8) RETURNING *`,
   [req.apiKey.customer_id,reference,Number(amount),currency,customer.email,customer.name||null,checkout.authorization_url,JSON.stringify(metadata)]);
  res.status(201).json({success:true,data:{...r.rows[0],checkout_url:checkout.authorization_url,access_code:checkout.access_code}});
 }catch(e){next(e)}
});

router.get("/:reference",async(req,res,next)=>{
 try{
  const r=await pool.query("SELECT * FROM transactions WHERE reference=$1 AND customer_id=$2",[req.params.reference,req.apiKey.customer_id]);
  if(!r.rows[0])return res.status(404).json({success:false,error:"Transaction not found"});
  res.json({success:true,data:r.rows[0]});
 }catch(e){next(e)}
});

router.post("/:reference/verify",async(req,res,next)=>{
 try{
  const r=await pool.query("SELECT * FROM transactions WHERE reference=$1 AND customer_id=$2",[req.params.reference,req.apiKey.customer_id]);
  if(!r.rows[0])return res.status(404).json({success:false,error:"Transaction not found"});
  const t=r.rows[0],data=await provider().verify(t.reference);
  if(data.status==="success"){
   if(Number(data.amount)!==Number(t.amount)||data.currency!==t.currency)return res.status(409).json({success:false,error:"Verified amount/currency does not match"});
   await pool.query("UPDATE transactions SET status='successful',provider_reference=$1,paid_at=COALESCE(paid_at,NOW()),updated_at=NOW() WHERE id=$2",[String(data.id),t.id]);
  }
  res.json({success:true,data});
 }catch(e){next(e)}
});
module.exports=router;