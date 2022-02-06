const { Family } = require("../models/human/family")
const { User } = require("../models/user/user")
const { Human } = require("../models/human/human")
const { Address } = require("../models/address/address")
const ObjectId = require('mongoose').Types.ObjectId
const { isValidObjectId, model } = require("mongoose")
const { formatAddress } = require("./Util/utilAddress")
const { formatHumanInfo } = require("./Util/utilHuman")

exports.createFamily = async function(req,res,next) {
    
    const process= await Promise.all([Family.findOne({householdCode:req.body.family.householdCode}),
                                        Address.findOne({_id:req.body.family.idAddressRef}),
                                        User.findOne({_id:req.decodedToken._id})
                                    ])

    const loggedInUser= process[2]
    //neu ma ho da ton tai
    if(process[0])
    return res.status(400).send('this household code already existed')

    //neu address khong hop le
    if(!process[1]) return res.status(400).send('invalid address')

    const {idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef} = process[1]
    const address =[idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef]
    
    let isAddressManagedByLoggedInUser = false
    console.log(req.decodedToken._id)
    //address co phai do nguoi nay quan ly khong
    address.forEach(scope=>{
        if(scope.equals(loggedInUser.idManagedScopeRef))
            isAddressManagedByLoggedInUser = true
    })
    if(!isAddressManagedByLoggedInUser) 
        return res.status(400).send('you must declare addressess managed by you')

    let newFamily = new Family({
                                headOfHouseholdName:req.body.family.headOfHouseholdName,
                                idCardOfHeadOfHousehold:req.body.family.idCardOfHeadOfHousehold,                               
                                idAddressRef :req.body.family.idAddressRef,
                                householdCode :req.body.family.householdCode,
                            })
    // validate family
    const {error} = Family.validate(newFamily)
    if(error) return res.status(400).send(error.details[0].message)  
    //save to db
    return newFamily.save()
                    .then(result=> res.status(200).send({idFamily:result._id,idAddressRef:result.idAddressRef}))
                    .catch(err=> res.status(500).send(err))

}
exports.editFamily= async (req,res,next)=>{
    if(!isValidObjectId(req.params.id))
        return res.status(400).send('invalid id family')
    const process = await Promise.all([Family.findOne({_id:req.params.id}).populate('idAddressRef'),
                                        User.findOne({_id:req.decodedToken._id})
                                    ])

        const family = process[0],loggedInUser=process[1]
        if(!family) return res.status(400).send('invalid id')

        const {idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef} = family.idAddressRef
        const address =[idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef]

        let isAddressManagedByLoggedInUser = false
        address.forEach(scope=>{
        if(scope.equals(loggedInUser.idManagedScopeRef))
        isAddressManagedByLoggedInUser = true
        })
        if(!isAddressManagedByLoggedInUser)
            return res.status(400).send('address of this family is not managed by you')
        const editedFamily = new Family(req.body.family)
        console.log(editedFamily)
        return Family.findOneAndUpdate({_id:req.params.id},req.body.family,{new:true})
                    .then(result=> res.status(200).send(result))
                    .catch(err=> console.log(err))
    
}

exports.deleteFamily = async (req,res,next)=>{
    if(!isValidObjectId(req.body.family._id))
    return res.status(400).send('invalid id family')
    const process = await Promise.all([Family.findOne({_id:req.params.id}).populate('idAddressRef'),
                                        User.findOne({_id:req.decodedToken._id})
                                    ])

    const family = process[0],loggedInUser=process[1]
    if(!family) return res.status(400).send('invalid id')

    const {idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef} = family.idAddressRef
    const address =[idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef]
    
    let isAddressManagedByLoggedInUser = false
    address.forEach(scope=>{
        if(scope.equals(loggedInUser.idManagedScopeRef))
            isAddressManagedByLoggedInUser = true
    })

    if(!isAddressManagedByLoggedInUser)
        return res.status(400).send('address of this family is not managed by you')

    return Family.findOneAndDelete({_id:req.params.id})
                    .then(family=>{
                        return Human.deleteMany({_id:{$in:family.members}})
                    })
                    .then(result=> res.status(200).send('success'))
                    .catch(err=> res.status(500).send(err))
}

exports.getFamiliesWithIdArea = async (req,res,next)=>{

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

    if(isValidObjectId(Object.values(ref)[0])) 
    return res.status(400).send('invalid id')
    const user = req.decodedToken
    const idAddresses = (await Address.find({$and:[ref,
                                            {$or:[{idCountryRef :user.idManagedScopeRef},{idCityRef:user.idManagedScopeRef},
                                            {idDistrictRef:user.idManagedScopeRef},{idCommuneRef:user.idManagedScopeRef},
                                            {idVillageRef:user.idManagedScopeRef}]}]})
                                    .select('_id'))
                                .map(address=>address._id)
    if(!idAddresses.length) return res.status(400).send('not found')
    const families =[]
    const addressFields ='idCountryRef idCityRef idDistrictRef idCommuneRef idVillageRef'
    return Family.find({idAddressRef:{$in:idAddresses}})
                .populate({path:'idAddressRef',model:'Address',
                            populate:{path:addressFields,model:'Scope'}
                        })                       
                .select('idAddressRef householdCode headOfHouseholdName members')
                .limit(10)
                .then(result=>{

                    if(!result.length) return res.status(404).send('not found')
                    const data = result.map(family=>{
                        return {
                            _id: family._id,
                            headOfHouseholdName:family.headOfHouseholdName,
                            householdCode:family.householdCode,
                            address: formatAddress(family.idAddressRef),
                            numberOfMembers: family.members.length
                        }
                    })
                    return res.status(200).send(data)
                    
                })
               
                .catch(err=> res.send(err))
}


exports.getInfoFamilyById = async (req,res,next)=>{
    if(!isValidObjectId(req.params.id))
        return res.status(400).send('invalid id')
        const addressFields ='idCountryRef idCityRef idDistrictRef idCommuneRef idVillageRef'

    const process = Promise.all([User.findOne({_id:req.decodedToken._id}),
                                                Family.findOne({_id:req.params.id})
                                                .populate({path:'idAddressRef',model:'Address',
                                                    populate:{path:addressFields,model: 'Scope',select:'name'}}
                                                    )   
                                ])

    const [user,family] = await process

    if(!user || !family)return res.send('not found')
    //neu dia chi tam tru cua human{id} thuoc khu vuc quan ly cua user
    let isManagedByUser = false
    const {idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef} = family.idAddressRef
    const ref = [idCountryRef,idCityRef,idDistrictRef,idCommuneRef,idVillageRef]
    ref.forEach(id=>{if(id.equals(user.idManagedScopeRef)) 
                        isManagedByUser = true
                    })
                    
    if(!isManagedByUser )   
        return res.status(404).send("can't find data match with id in your area that you manage")
     Human.find({_id:{$in:family.members}})
                                .populate({path:'idPermanentAddressRef',model:'Address',
                                populate:{path:addressFields,model: 'Scope',select:'name'}
                            }).select('-idTemporaryResidenceAddressRef')
        .then(results=>{
            if(!results.length) return res.status(404).send('not found')
            return {
                headOfHouseholdName:family.headOfHouseholdName,
                householdCode:family.householdCode,
                address: formatAddress(family.idAddressRef),
                members: results.map(result=>{
                    return formatHumanInfo(result)
                })

            }
        })
        .then(result=> res.status(200).send(result))
        .catch(err=> console.log(err))


}
