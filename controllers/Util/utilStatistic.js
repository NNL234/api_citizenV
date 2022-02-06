const { Human } = require("../../models/human/human")
const ObjectId = require('mongoose').Types.ObjectId

//lay danh sach gia tri trong 1 field
// values  = await Human.distinct('<field_name>')

//thong ke so dan theo dia chi tam tru day du của 1 số làng (nếu thống kê tát cả thì comment phần match)
    exports.countThePopulation =(addresses) => Human.aggregate([ 
        {
            $match:{
                idTemporaryResidenceAddressRef: {
                    $in:addresses
                }
            }
        },
       
            {
                $group:{
                    _id:{
                        gender:"$gender"
                    },
                    count: { $sum: 1 },
                }
            }
                
    ])

//thống kê theo giới tính,độ tuổi dân số theo các khoảng tuổi của 1 số làng( có thể theo xã,thành phố)
    exports.censusByAgeAndGender =(addresses)=> Human.aggregate([
            {
                $match:{
                    idTemporaryResidenceAddressRef: {

                        $in:addresses
                    }
                }
            },
            {
                $project:{
                    age:{
                        $subtract:[{$year:"$$NOW"},{$year:"$birth"}]
                    },
                    gender:1,
                    idTemporaryResidenceAddressRef:1,
                                    
                }
            },
            {
                $group:{
                                _id:{
                                    gender:"$gender",
                                    rangeAge:{
                                        $cond: {
                                            if: { $gte: [ "$age", 80 ] }, then: ">=80",
                                            else: {
                                                $cond: {
                                                    if: { $gte: [ "$age", 70 ] }, then: "70-79",
                                                    else: {
                                                        $cond: {
                                                            if: { $gte: [ "$age", 60 ] }, then: "60-69",
                                                            else: {
                                                                $cond: {
                                                                    if: { $gte: [ "$age", 50 ] }, then: "50-59",
                                                                    else: {
                                                                        $cond: {
                                                                            if: { $gte: [ "$age", 40 ] }, then: "40-49",
                                                                            else: {
                                                                                $cond: {
                                                                                    if: { $gte: [ "$age", 30 ] }, then: "30-39",
                                                                                    else: {
                                                                                        $cond: {
                                                                                            if: { $gte: [ "$age", 20 ] }, then: "20-29",
                                                                                            else: {
                                                                                                $cond: {
                                                                                                    if: { $gte: [ "$age", 10 ] }, then: "10-19",
                                                                                                    else: "0-9" }
                                                                                            } }
                                                                                    } }
                                                                            } }
                                                                    } }
                                                            } }
                                                    } }
                                            } }
                                    }
                                },
                                count: { $sum: 1 },
                            }
            },
        ])

//số người có và không có việc làm trong 1 số làng(nếu muốn tìm tất thì comment phần match)
     exports.statisticsOnTheNumberOfUnemployedAndEmployedPeople =(addresses)=>  Human.aggregate([
            {
                $match:{
                    idTemporaryResidenceAddressRef: {

                $in:addresses
            }
                }
            },
            {
                $group:{
                    _id:{
                        unemployment: {$eq:["$job",""] }
                    },
                    count:{
                        $sum:1
                    }
                }
            }
        ])

     exports.statisticsOnReligion=(addresses)=>Human.aggregate([
            {
            $match:{
                idTemporaryResidenceAddressRef: {
                    $in:addresses
                }
            }
            },
            {
                $group:{
                    _id:{
                        religion:"$religion"
                    },
                    count:{$sum:1}

                },
            }
        ])
 //thống kê trình độ văn hóa của dân sô của một số làng (nếu muốn thống kê tất cả thì comment phần match)
    exports.statisticsOnEducationalLevel=(addresses)=> Human.aggregate([
        {
        $match:{
            idTemporaryResidenceAddressRef: {
                $in:addresses
            }
        }
        },
        {
            $group:{
                _id:{
                    educationalLevel:"$educationalLevel"
                },
                count:{$sum:1}

            },
        },
    ])


exports.formatData = function(data,KEYSLIST,SECONDKEYLIST=[]) {
        const formattedData =[]
        if(!data.length) return []
        const keyData =  Object.keys(data[0])
        KEYSLIST.forEach(firstKey=>{    
               if(SECONDKEYLIST.length){
                 SECONDKEYLIST.forEach(secondKey=>{
                    let newUnit = {}
                    newUnit[keyData[0]] = firstKey
                    newUnit[keyData[1]] = secondKey
                    newUnit['count'] = 0
                    data.forEach(unit=>{
                      if(unit[keyData[0]]== firstKey && unit[keyData[1]] == secondKey){
                          newUnit.count = unit.count
                      }
                    })
                    formattedData.push(newUnit)
                })
                
               }
               else {
                let newUnit = {}
                newUnit[keyData[0]] = firstKey
                newUnit['count'] = 0
                   data.forEach(unit=>{
                       if(unit[keyData[0]]== firstKey)
                            newUnit.count = unit.count
                   })
                   formattedData.push(newUnit)
               }
            })
    
        return formattedData
    }