const { isValidObjectId } = require("mongoose")
const { Human } = require("../models/human/human")
const { Family } = require("../models/human/family")
const { User } = require("../models/user/user")
const {Scope}  = require('../models/address/scope')
const {Address}  = require('../models/address/address')
const { object } = require("joi")
const { formatAddress } = require("./Util/utilAddress")
const { formatHumanInfo } = require("./Util/utilHuman")


exports.getInfoHumanWithId =  async function(req,res,next) {
    if(!isValidObjectId(req.params.id))
        return res.status(400).send('invalid id')
        const addressFields ='idCountryRef idCityRef idDistrictRef idCommuneRef idVillageRef'

    const process = Promise.all([User.findOne({_id:req.decodedToken._id}),
                                                Human.findOne({_id:req.params.id})
                                                .populate([{path:'idTemporaryResidenceAddressRef',model:'Address',
                                                    populate:{path:addressFields,model: 'Scope',select:'name'}},
                                                    {path:'idPermanentAddressRef',model:'Address',
                                                    populate:{path:addressFields,model: 'Scope',select:'name'}}
                                                    ])   
                                ])

    const [user,human] = await process

    if(!user || !human)return res.send('not found')
    //neu dia chi tam tru cua human{id} thuoc khu vuc quan ly cua user
    let isManagedByUser = false
    const {idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef} = human.idTemporaryResidenceAddressRef
    const ref = [idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef]
    ref.forEach(id=>{if(id.equals(user.idManagedScopeRef)) 
                        isManagedByUser = true
                    })
                    
    if(isManagedByUser )   
        return res.status(200).send(human)
        
    return res.status(404).send("can't find data match with id in your area that you manage")
}


exports.changeHumanInfoWithId = async function(req,res,next){
    if(!isValidObjectId(req.params.id)||!isValidObjectId(req.query.idFamily))
        return res.status(400).send('invalid id')
    const process = Promise.all([User.findOne({_id:req.decodedToken._id,idFamilyRef:req.query.idFamily}),
                                Human.findOne({_id:req.params.id,idFamilyRef:req.query.idFamily})
                                    .populate('idTemporaryResidenceAddressRef')
                                    .select('-__v')    
                                ])
    const [user,human] = await process
    if(!user || !human)return res.send('invalid id')
    //neu dia chi tam tru cua human{id} thuoc khu vuc quan ly cua user
    let isManagedByUser = false
    const {idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef} = human.idTemporaryResidenceAddressRef
    const ref = [idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef]
    ref.forEach(id=>{if(id.equals(user.idManagedScopeRef)) 
                        isManagedByUser = true
                    })
    const editedHuman ={idTemporaryResidenceAddressRef:human.idTemporaryResidenceAddressRef._id,
                        ...(req.body.human),
                        idFamilyRef:req.query.idFamily
                    }
    if(isManagedByUser ){
        const {err}= Human.validate(editedHuman)
        if(err) return res.status(400).send(err)
        return Human.findOneAndUpdate({_id:req.params.id},req.body.human,{new: true,select:"name cardId -_id "})
                    .then(response=>res.status(200).send("success"))
                    .catch(err=>res.status(500).send(err))
    }
    return res.status(404).send("can't find data match with id in your areas that you manage")

}

exports.removeHumanInfoById = async (req,res,next) =>{
    if(!isValidObjectId(req.params.id)||!isValidObjectId(req.query.idFamilyRef))
        return res.status(400).send('invalid id')
    const process = Promise.all([User.findOne({_id:req.decodedToken._id}),
                                                Human.findOne({_id:req.params.id,idFamilyRef:req.query.idFamily})
                                                .populate('idTemporaryResidenceAddressRef idFamilyRef')
                                                .select('-__v')    
                                ])
    const [user,human] = await process
    if(!user || !human)
        return res.send('not found')
    //neu dia chi tam tru cua human{id} thuoc khu vuc quan ly cua user
    const {idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef} = human.idTemporaryResidenceAddressRef
    const ref = [idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef]
    ref.forEach(id=>{if(id.equals(user.idManagedScopeRef)) 
                        isManagedByUser = true
                    })
    if(isManagedByUser){

        let editFamily 
        if(human.idFamilyRef.members.length == 1) 
            editFamily = Family.findOneAndDelete({_id:req.query.idFamily})
        else{
            const index = human.idFamilyRef.members.indexOf(human._id)
                        if(index!= -1)
                            human.idFamilyRef.members.splice(index,1)
            editFamily = Family.findOneAndUpdate({_id:human.idFamilyRef._id},
                                                {members: human.idFamilyRef.members},
                                                {new:true})
        }   
        return Promise.all([Human.findOneAndDelete({_id:req.params.id})
                .then(response=>{
                    //remove _id of member from family
                    //if user remove is headOfhousehold                    
                    return res.status(200).send(response)
                })
                .catch(err=>res.status(500).send(err)),
                editFamily
            ])
        }
    return res.status(404).send("can't find data match with id in your area that you manage")
}

exports.getInfoHumen = async(req,res,next)=>{
    let idVillages =[]
    let result
    if(req.decodedToken.role!='A1'&&req.decodedToken.role!='admin') {
        //if(scope{req.param.id} belong to logged in user's managed scope)
        result = await Scope.find({areaCode:{$regex:new RegExp('^'+ req.decodedToken.username)},typeOfScope:'village'})
                                    .select('_id')    
    }
    else{
        result = await Scope.find({typeOfScope: 'village'})
                                    .select('_id')
    }

        if(!result.length) return res.status(404).send('not found')
        idVillages = result.map(village=>village._id)
            const idAddresses = (await Address.find({idVillageRef:{$in:idVillages}})
                                                .select('_id'))
                                .map(address=>address._id)

        const addressFields ='idCountryRef idCityRef idDistrictRef idCommuneRef idVillageRef'
        
        return Human.find({idTemporaryResidenceAddressRef:{$in:idAddresses}})
                                    //populate temporary residence address
                    .populate([{path:'idTemporaryResidenceAddressRef',model:'Address',
                                    populate:{path:addressFields,model: 'Scope',select:'name -_id '}},
                                    //populate permanent address
                                {path:'idPermanentAddressRef',model:'Address',
                                    populate:{path:addressFields,model: 'Scope',select:'name -_id'}}
                            ])
                    .limit(5)
                    .then((results)=>{
                        if(!results.length)
                            res.status(404).send('not found')
                        const data = results.map(result=>{
                            return formatHumanInfo(result)
                        })
                            return res.status(200).send(data)
                    })
                    .catch(err=> res.status(500).send(err))                    

}

exports.getInfoHumansWithIdArea =async  function(req,res,next) {
    let ref ={typeOfScope : 'country'}
    if(req.query.idCityRef) {
        ref.idCityRef= req.query.idCityRef
        ref.typeOfScope = 'city'
    }
    else if(req.query.idDistrictRef) {
        ref.idDistrictRef= req.query.idDistrictRef
        ref.typeOfScope = 'district'
    }
    else if(req.query.idCommuneRef) {
        ref.idCommuneRef= req.query.idCommuneRef
        ref.typeOfScope = 'commune'
    }
    else if(req.query.idVillageRef) {
        ref.idVillageRef= req.query.idVillageRef
        ref.typeOfScope = 'village'
    }
    else if(req.url.split('/')[1] != 'country') 
        return res.status(404).send('not found')

    if(!isValidObjectId(Object.values(ref)[1])) 
        return res.status(400).send('invalid id')
    const user= req.decodedToken
    const idAddresses = (await Address.find({$and:[ref,
                                        {$or:[{idCountryRef :user.idManagedScopeRef},{idCityRef:user.idManagedScopeRef},
                                        {idDistrictRef:user.idManagedScopeRef},{idCommuneRef:user.idManagedScopeRef},
                                        {idVillageRef:user.idManagedScopeRef}]}]})
                                    .select('_id'))
                                .map(address=>address._id)
    if(!idAddresses.length) return res.status(404).send('not found')
    const addressFields ='idCountryRef idCityRef idDistrictRef idCommuneRef idVillageRef'
        return Human.find({idTemporaryResidenceAddressRef:{$in:idAddresses}})
                                    //populate temporary residence address
                    .populate([{path:'idTemporaryResidenceAddressRef',model:'Address',select:'-_id ',
                                    populate:{path:addressFields,model: 'Scope',select:'name -_id'}},
                                    //populate permanent address
                                {path:'idPermanentAddressRef',model:'Address',
                                    populate:{path:addressFields,model: 'Scope',select:'name -_id'}}
                            ])
                    .limit(5)
                    .then((results)=>{
                        if(!results.length)
                            res.status(404).send('not found')
                        const data = results.map(result=>{
                            return formatHumanInfo(result)
                        })
                            return res.status(200).send(data)
                    })
                    .catch(err=> res.status(500).send(err))      
    
}

exports.createHuman=async (req,res,next) => {
    if(!isValidObjectId(req.query.idFamilyRef)) return res.status(400).send('invalid id family')
    const process = await Promise.all([Family.findOne({_id:req.query.idFamily})
                                        .populate('idAddressRef'),
                                        User.findOne({_id:req.decodedToken._id}),
                                        Address.findOne({_id:req.body.human.idPermanentAddressRef})
                                    ])                               
    const family = process[0]
    const loggedInUser = process[1]
    if(!family) return res.status(400).send('invalid id family')
    const {idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef} = family.idAddressRef
    const address =[idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef]
    
    let isAddressManagedByLoggedInUser = false
    address.forEach(scope=>{
        if(scope.equals(loggedInUser.idManagedScopeRef))
            isAddressManagedByLoggedInUser = true
    })
    const idPermanentAddressRef = process[2]
    if(!idPermanentAddressRef) return res.status(400).send('invalid id permanent address')

    if(!isAddressManagedByLoggedInUser)
            return res.status(400).send('address of this family is not managed by you')

    const newHuman = new Human({
        ...req.body.human,
        idTemporaryResidenceAddressRef: family.idAddressRef._id,
        idFamilyRef:family._id        
        })
        
    const {err} = Human.validate(newHuman)
    if(err) return res.status(400).send(err)
    return newHuman.save()
                    .then(human=> {
                        family.members.push(human._id)
                        return Family.findOneAndUpdate({_id:family._id},{members:family.members},{new:true})
                    })
                    .then(result=> res.status(200).send('success'))
                    .catch(err=> res.status(500).send(err))
}
