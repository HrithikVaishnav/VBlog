const dotenv = require("dotenv");
dotenv.config();
dbPassword = process.env.DB_URL;

module.exports = {
    mongoURI: dbPassword
}
