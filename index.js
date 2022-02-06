const express = require('express');
const config = require('config');
const app = express();
const port = process.env.PORT || config.get("port");
const routes = require('./routes');

const { User } = require('./models/user/user');
const { Role } = require('./models/user/role');
const { Scope } = require('./models/address/scope');
const   {Address} = require('./models/address/address');
const { Human } = require('./models/human/human');
const {Family} = require('./models/human/family');
const { refreshStatisticsData } = require('./controllers/update/updateStaticalInfo');

require("./startup/cors")(app);
// create application/json parser
app.use(express.json());
// create application/x-www-form-urlencoded parser
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth",routes.auth); 
app.use("/api/user",routes.user);
app.use("/api/address",routes.address);
app.use("/api/human",routes.human);
app.use("/api/family",routes.family);
require("./startup/db")();
require("./controllers/update/updater.js");
require("./controllers/update/updateAddresses")

// refreshStatisticsData()
app.listen(port,()=>{
    console.log('app listening at http://localhost:'+port)
})