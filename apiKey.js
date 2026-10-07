const pool=require("../db"),{sha256}=require("../security");
async function requireApiKey(req,res,next){
 try{
  const raw=req.get("x-api-key");
  if(!raw)return res.status(401).json({success:false,error:"x-api-key is required"});
  const r=await pool.query(`SELECT ak.id,ak.customer_id,c.email,c.name
    FROM api_keys ak JOIN customers c ON c.id=ak.customer_id
    WHERE ak.key_hash=$1 AND ak.revoked_at IS NULL`,[sha256(raw)]);
  if(!r.rows[0])return res.status(401).json({success:false,error:"Invalid or revoked API key"});
  req.apiKey=r.rows[0];
  await pool.query("UPDATE api_keys SET last_used_at=NOW() WHERE id=$1",[r.rows[0].id]);
  next();
 }catch(e){next(e)}
}
module.exports={requireApiKey};