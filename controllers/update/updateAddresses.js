const { Address } = require("../../models/address/address")
const { Scope } = require("../../models/address/scope")
const { StatisticsData } = require("./updateStaticalInfo")

//sau khi tat ca khai bao thì update address
const updateAddresses = async (req,res,next)=> {
    const processes = await Promise.all([ Scope.find({typeOfScope:'village'}) //find full address of all village
    
                                .populate({path:'belongToIdScopeRef',model:'Scope',select:'_id',
    
                                    populate:{path:'belongToIdScopeRef',model:'Scope',select:'_id',                                                               
                                
                                    populate:{path:'belongToIdScopeRef',model:'Scope',select:'_id',                                                               
                                
                                    populate:{path:'belongToIdScopeRef',model:'Scope',select:'_id',                           
                                }}}
    
                                }),
                                Address.find({})//find all fullAddress existed
                            ])
        const villages = processes[0]
        const existedAddress = processes[1].map(address=> address.idVillageRef)
        const newAddresses=[]
        const newStatisticsData =[]
         villages.forEach(village=>{
             let isExisted = false
                //check full address already existed  or not
                existedAddress.forEach(address=>{
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
                    newStatisticsData.push(new StatisticsData({areaCode:village.areaCode}))
                }
     
            })
        return Promise.all([Address.insertMany(newAddresses),StatisticsData.insertMany(newStatisticsData)])
                        .then(result=>res.send('success'))
                        .catch(err=>res.send(err))
    }
    
    module.exports = {
        updateAddresses
    }