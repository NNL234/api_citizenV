const { formatAddress } = require("./utilAddress")

exports.formatHumanInfo = (human) => {
    const birth = new Date(human.birth)
    const data ={
        name:human.name,
        cardId:human.cardId,
        birth:`${birth.getDate()}/${birth.getMonth()+1}/${birth.getFullYear()}`,
        job:human.job,
        religion:human.religion,
        gender:human.gender,
        hometown:human.hometown,
        educationalLevel:human.educationalLevel,
        permanentAddress:formatAddress(human.idPermanentAddressRef),}
        if(human.idTemporaryResidenceAddressRef)
        data.idTemporaryResidenceAddressRef =formatAddress(human.idTemporaryResidenceAddressRef)
        return data
}
