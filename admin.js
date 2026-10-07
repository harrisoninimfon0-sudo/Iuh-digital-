const express=require("express"),pool=require("../db"),{adminToken,requireAdmin}=require("../auth");
const router=express.Router();
router.post("/login",(req,res)=>{
 if(req.body.email!==process.env.ADMIN_EMAIL||req.body.password!==process.env.ADMIN_PASSWORD)return res.status(401).json({success:false,error:"Invalid admin credentials"});
 res.json({success:true,token:adminToken(req.body.email)});
});
router.use(requireAdmin);
router.get("/stats",async(req,res,next)=>{
 try{
  const q=async(sql)=>Number((await pool.query(sql)).rows[0].count);
  const [c,k,t,v]=await Promise.all([q("SELECT COUNT(*) count FROM customers"),q("SELECT COUNT(*) count FROM api_keys WHERE revoked_at IS NULL"),q("SELECT COUNT(*) count FROM transactions"),pool.query("SELECT COALESCE(SUM(amount),0) amount FROM transactions WHERE status='successful'")]);
  res.json({success:true,data:{customers:c,activeApiKeys:k,transactions:t,successfulVolumeMinorUnits:v.rows[0].amount}});
 }catch(e){next(e)}
});
router.get("/transactions",async(req,res,next)=>{try{const r=await pool.query(`SELECT t.reference,t.amount,t.currency,t.status,t.provider,t.customer_email,t.created_at,t.paid_at FROM transactions t ORDER BY t.created_at DESC LIMIT 100`);res.json({success:true,data:r.rows})}catch(e){next(e)}});
router.get("/customers",async(req,res,next)=>{try{const r=await pool.query(`SELECT c.id,c.name,c.email,c.created_at,COUNT(ak.id)::int api_keys FROM customers c LEFT JOIN api_keys ak ON ak.customer_id=c.id AND ak.revoked_at IS NULL GROUP BY c.id ORDER BY c.created_at DESC`);res.json({success:true,data:r.rows})}catch(e){next(e)}});
router.post("/api-keys/:id/revoke",async(req,res,next)=>{try{const r=await pool.query("UPDATE api_keys SET revoked_at=NOW() WHERE id=$1 AND revoked_at IS NULL RETURNING id,key_prefix,revoked_at",[req.params.id]);if(!r.rows[0])return res.status(404).json({success:false,error:"Active key not found"});res.json({success:true,data:r.rows[0]})}catch(e){next(e)}});
module.exports=router;