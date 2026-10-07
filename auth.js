const express=require("express"),bcrypt=require("bcryptjs"),crypto=require("crypto");
const pool=require("../db"),{sha256}=require("../security");
const router=express.Router();
router.post("/register",async(req,res,next)=>{
 try{
  const{name,email,password}=req.body;
  if(!name||!email||!password||password.length<8)return res.status(400).json({success:false,error:"name, email and password (8+ characters) required"});
  const hash=await bcrypt.hash(password,12);
  const r=await pool.query(`INSERT INTO customers(name,email,password_hash)VALUES($1,$2,$3)
    RETURNING id,name,email,created_at`,[name.trim(),email.trim().toLowerCase(),hash]);
  res.status(201).json({success:true,data:r.rows[0]});
 }catch(e){if(e.code==="23505")return res.status(409).json({success:false,error:"Email already registered"});next(e)}
});
router.post("/api-keys",async(req,res,next)=>{
 try{
  const{email,password,name="Default key"}=req.body;
  const r=await pool.query("SELECT id,password_hash FROM customers WHERE email=$1",[(email||"").toLowerCase().trim()]);
  if(!r.rows[0]||!(await bcrypt.compare(password||"",r.rows[0].password_hash)))return res.status(401).json({success:false,error:"Invalid credentials"});
  const key=`iuh_live_${crypto.randomBytes(32).toString("base64url")}`;
  await pool.query("INSERT INTO api_keys(customer_id,name,key_prefix,key_hash)VALUES($1,$2,$3,$4)",
    [r.rows[0].id,name,key.slice(0,20),sha256(key)]);
  res.status(201).json({success:true,message:"Save this key now; it cannot be displayed again.",data:{apiKey:key}});
 }catch(e){next(e)}
});
module.exports=router;