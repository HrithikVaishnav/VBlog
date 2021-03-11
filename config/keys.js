const dotenv = require("dotenv");
dotenv.config();
dbPassword = process.env.DB_URL;
//console.log(dbPassword);
module.exports = {
    mongoURI: dbPassword
}
