const { User } = require("../models/user/user")
const {Scope} = require('../models/address/scope')
const { Family } = require("../models/human/family")
const { Human } = require("../models/human/human")
const ObjectId = require('mongoose').Types.ObjectId
const { isValidObjectId } = require("mongoose")
const { Address } = require("../models/address/address")
const { getData } = require("./update/updateStaticalInfo")
const utilStatistics = require('./Util/utilStatistic')
const { GENDERS, RELIGIONS, RANGEAGES, EDUCATIONALLEVELS } = require("../config/dataConfig")
const getStatisticsInfoScopeById = async function(req,res,next) {

    if(!isValidObjectId(req.query.id)) 
        return res.status(400).send('invalid id')
        const typeOfScope = req.url.split('/')[1]
        let ref ={typeOfScope : 'country'}
        if(req.query.idCityRef && typeOfScope =='city') {
            ref.idCityRef= req.query.idCityRef
        }
        else if(req.query.idDistrictRef&& typeOfScope =='district') {
            ref.idDistrictRef= req.query.idDistrictRef
        }
        else if(req.query.idCommuneRef&& typeOfScope =='commune') {
            ref.idCommuneRef= req.query.idCommuneRef
        }
        else if(req.query.idVillageRef&& typeOfScope =='village') {
            ref.idVillageRef= req.query.idVillageRef
        }
        else if(req.url.split('/')[1] != 'country') 
            return res.status(404).send('not found')
        ref.typeOfScope = typeOfScope
    if(!isValidObjectId(Object.values(ref)[1]))
        return res.status(400).send('invalid id')
    const scope = await Scope.findOne({_id:Object.values(ref)[1]})

    if(!scope) return res.status(404).send('not found')
    
    if(!(scope.areaCode.startsWith(req.decodedToken.username))&&req.decodedToken.role!='A1') 
        return res.status(403).send('This area is not managed by you') 
    
    return Address.find(ref).select("_id")
                .then(result=> {
                    const addresses = result.map(address=> address._id)
                    // return Promise.all([getData("","populationData","gender"),
                    //                     getData("","employmentAndUnemploymentData","unemployment"),
                    //                     getData("01","ReligionData","religion"),
                    //                     getData("010103","RangeAgeAndGenderData","rangeAge"),
                    //                     getData("0101","educationalData","educationalLevel")
                    //                 ])
                    
                    return Promise.all([utilStatistics.countThePopulation(addresses),
                        utilStatistics.statisticsOnTheNumberOfUnemployedAndEmployedPeople(addresses),
                        utilStatistics.statisticsOnReligion(addresses),
                        utilStatistics.censusByAgeAndGender(addresses),
                        utilStatistics.statisticsOnEducationalLevel(addresses)
            ])
                }
                   )
                .then(data=>{
                    const results= data.map(result=>{
                            return result.map(unit=>{
                                return {...unit._id,count:unit.count}
                            })
                    })
                    return res.status(200).send({
                        populationData:utilStatistics.formatData(results[0],GENDERS),
                        employmentAndUnemploymentData:results[1],
                        ReligionData:utilStatistics.formatData(results[2],RELIGIONS),
                        RangeAgeAndGenderData:utilStatistics.formatData(results[3],GENDERS,RANGEAGES),
                        educationalData:utilStatistics.formatData(results[4],EDUCATIONALLEVELS)
                    }) 
                })
                
                .catch(err=> console.log(err))
}





module.exports = {
    getStatisticsInfoScopeById,
}