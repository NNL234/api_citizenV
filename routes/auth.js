const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose")
const router = express.Router();
const generateAuthToken = require("../middleware/generateAuthToken");
const { User } = require("../models/user/user")

//login
router.post("/", async (req,res) => {
   
    const user = await User.findOne({username:req.body.username})
                        .populate({path:'idRoleRef',model:'Role'})
                        .populate({path:'idManagedScopeRef',model:'Scope'}) 
                        
    if(!user) 
        return res.status(400).send("Invalid username or password");
    const checkPassword = await bcrypt.compare(req.body.password, user.password)
    if(!checkPassword) 
    return res.status(400).send("Invalid username or password");
    const token = generateAuthToken({
        _id : user._id,
        username:user.username,
        role : user.idRoleRef.name,
        declarable: user.declarable,
        idManagedScopeRef:user.idRoleRef.name != 'admin'?user.idManagedScopeRef._id:'A1',
        areaCode:user.idRoleRef.name != 'admin'?user.idManagedScopeRef.areaCode:''
    })
    return res.send({token,
                    area:user.idManagedScopeRef? user.idManagedScopeRef.name:'',
                    idArea: user.idRoleRef.name != 'admin'?user.idManagedScopeRef._id:'',
                    idUser:user._id,
                    areaCode:user.idRoleRef.name != 'admin'?user.idManagedScopeRef.areaCode:''
                });
})

module.exports =router;