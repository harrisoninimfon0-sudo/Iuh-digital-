require("dotenv").config();
const fs=require("fs"),pool=require("./db");
(async()=>{try{await pool.query(fs.readFileSync("sql/schema.sql","utf8"));console.log("Database ready");process.exit(0)}catch(e){console.error(e);process.exit(1)}})();