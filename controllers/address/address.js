const { Address } = require("../../models/address/address")
const { Scope } = require("../../models/address/scope")
const mongoose = require('mongoose')
const { findAddressById} = require("../Util/utilAddress")
const ObjectId =mongoose.Types.ObjectId


//get _id name of country(or area{country})
const getAreaById = async function(req,res,next) {
    if(!mongoose.isValidObjectId(req.params.id))
        return res.status(400).send('invalid id')

    const typeOfScope = req.url.split('/')[1]
    let process
    if(req.url.includes('country')) 
        process = Scope.find({typeOfScope:typeOfScope}).select('_id name' )
    else 
        process = Scope.find({_id:new ObjectId(req.params.id),typeOfScope:typeOfScope}).select('_id name' )
    
    return process
        .then(result=> {
            if(result) return res.status(200).send(result)
            return res.status(404).send('not found')
        })
        .catch(err=>res.status(500).send(err))
}
//get fullAddress(country,city,district,commune,village) by id
const  getAddressById =async (req,res,next)=> {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).send("Invalid Id");

    const address = await findAddressById(req.params.id)
                         .populate('idCountryRef idCityRef idDistrictRef idCommuneRef idVillageRef')
    if (!address) {
      return res.status(404).send("not found");
    }
    return res.status(200).send(address);
  }

 const getFullAddressOfVillageById = async(req,res,next) =>{
    if (!mongoose.isValidObjectId(req.query.idVillageRef))
    return res.status(400).send("Invalid Id");
     return Address.findOne({idVillageRef:req.query.idVillageRef})
                    .then(result=>{
                        if(!result) return res.status(404).send('not found')
                        return res.status(200).send(result)
                    })
                    .catch(err=> res.status(500).send(err))
 }


 const changeInfomationOfAreaWithId = (req,res,next)=>{
     if(!req.query.id||!mongoose.isValidObjectId(req.query.id)) 
        return res.status(400).send('invalid id')
     return Scope.findOneAndUpdate({_id:req.query.id,belongToIdScopeRef:req.decodedToken.idManagedScopeRef},
                                    {name:req.body.areaName})
                    .then(result=> result?res.status(200).send('success'):res.status(404).send('not found'))
                    .catch(err=> res.status(500).send(err))

 }

module.exports={
    getAreaById,
    getAddressById,
    getFullAddressOfVillageById,
    changeInfomationOfAreaWithId,
}
