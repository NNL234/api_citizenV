const { isValidObjectId } = require("mongoose")
const { Address } = require("../../models/address/address")
const { Scope } = require("../../models/address/scope")

async function findAddressById(idAddress) {
    const address =await Address.findOne({_id:idAddress})
                  .populate('idCountryRef idCityRef idDistrictRef idCommuneRef idVillageRef') 
                  .select('name -_id')
                  console.log(address)
    if(!address) return null
    return address
}
async function findIdAddress(address) {
    //adddress chua cac idScopeRef
    const idAddress = await Address.findOne({address}).select('_id -__v')
    if(!idAddress) return null
    return idAddress
}

async function isValidAddress(address) {
    const process = Promise.all([   Scope.findOne({_id:address.idCountryRef,typeOfScope:'country'}),
                                    Scope.findOne({_id:address.idCityRef,typeOfScope:'city'}),
                                    Scope.findOne({_id:address.idDistrictRef,typeOfScope:'district'}),
                                    Scope.findOne({_id:address.idCommuneRef,typeOfScope:'commune'}),
                                    Scope.findOne({_id:address.idVillageIdRef,typeOfScope:'village'})
                                ])
    const addressDb = await process
    const [country,city,district,commune,village] = addressDb

    if(village.belongToIdScopeRef != commune._id
        ||commune.belongToIdScopeRef != district._id
        ||district.belongToIdScopeRef != city._id)
            return false
    return true
        
}

async function updateAddresses() {
    const processes = await Promise.all([ Scope.find({typeOfScope:'village'})

                            .populate({path:'belongToIdScopeRef',model:'Scope',select:'_id',

                                populate:{path:'belongToIdScopeRef',model:'Scope',select:'_id',                                                               
                            
                                populate:{path:'belongToIdScopeRef',model:'Scope',select:'_id',                                                               
                            
                                populate:{path:'belongToIdScopeRef',model:'Scope',select:'_id',                           
                            }}}

                            }),
                            Address.find({})
                        ])
    const villages = processes[0]
    const existedAddress = processes[1].map(address=> address.idVillageRef)
                        console.log(processes[0])
    const newAddresses=[]
     villages.forEach(village=>{
         let isExisted = false
            existedAddress.forEach(address=>{
                console.log(village)
                if(address.equals(village._id))
                    isExisted = true
            })
            if(!isExisted){
                const commune = village.belongToIdScopeRef,
                district = commune.belongToIdScopeRef,
                city= district.belongToIdScopeRef,
                country= city.belongToIdScopeRef
                const address ={idCountryRef:country._id,
                                idCityRef:city._id,
                                idDistrictRef:district._id,
                                idCommuneRef:commune._id,
                                idVillageRef:village._id,
                            }
                newAddresses.push (new Address(address))
            }
 
        })
    return Address.insertMany(newAddresses)
}

const formatAddress = (address)=>{
    // console.log(address.idVillageRef)
    return address.idVillageRef.name +','+
            address.idCommuneRef.name+','+
            address.idDistrictRef.name+','+
            address.idCityRef.name+','+
            address.idCountryRef.name

}



module.exports={
    findAddressById,
    findIdAddress,
    isValidAddress,
    formatAddress,
    // creatAddresses,
}

