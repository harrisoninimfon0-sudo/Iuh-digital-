const express=require("express"),{requireApiKey}=require("../middleware/apiKey"),pool=require("../db"),{provider}=require("../providers");
const router=express.Router();router.use(requireApiKey);
router.post("/",async(req,res,next)=>{
 try{
  const{reference,amount,reason="Customer requested refund"}=req.body;
  const t=(await pool.query("SELECT * FROM transactions WHERE reference=$1 AND customer_id=$2",[reference,req.apiKey.customer_id])).rows[0];
  if(!t||t.status!=="successful")return res.status(400).json({success:false,error:"Only successful transactions can be refunded"});
  const refundAmount=Number(amount||t.amount);
  if(refundAmount<=0||refundAmount>Number(t.amount))return res.status(400).json({success:false,error:"Invalid refund amount"});
  const p=await provider().refund(t.provider_reference,refundAmount,reason);
  const r=await pool.query(`INSERT INTO refunds(transaction_id,amount,status,provider_reference,reason)
    VALUES($1,$2,$3,$4,$5) RETURNING *`,[t.id,refundAmount,p.status||"pending",p.id?String(p.id):null,reason]);
  res.status(201).json({success:true,data:r.rows[0]});
 }catch(e){next(e)}
});
module.exports=router;