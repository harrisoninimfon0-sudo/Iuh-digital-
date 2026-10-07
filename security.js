const crypto=require("crypto");
function sha256(v){return crypto.createHash("sha256").update(v).digest("hex")}
function timingSafeEqual(a,b){
 const aa=Buffer.from(a),bb=Buffer.from(b);
 return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}
module.exports={sha256,timingSafeEqual};