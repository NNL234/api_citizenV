const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = (payload) => {
    const token = jwt.sign(payload,config.get("jwtPrivateKey"),{
        expiresIn:"1d"// EXP: 1 day 
    });
    return token;
}