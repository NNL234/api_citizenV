const { isValidObjectId } = require("mongoose");
const {  getAreaById, getAddressById, getFullAddressOfVillageById, changeInfomationOfAreaWithId } = require("../controllers/address/address");
const { getFamiliesWithIdArea } = require("../controllers/family");
const {  getInfoHumansWithIdArea } = require("../controllers/human");
const { getStatisticsInfoScopeById } = require("../controllers/statistics");
const auth = require("../middleware/auth");
const checkRoleToAddUser = require("../middleware/checkRoleToAddUser");
const checkRoleToViewScopeInfo = require("../middleware/checkRoleToViewScopeInfo");
const { Scope } = require("../models/address/scope");
const router = require("express").Router();

//get all cities
router.get('/city',[auth],async (req,res,next)=>{
    const city = await Scope.find({typeOfScope:'city'}).select("_id name");
    if (!city) return res.status(400).send().send("Error");
    res.status(200).send(city);
})

// get list human of area using _id save in req.query (idCityRef,idDistrictRef,idCommuneRef,idVillageRef)
router.get(['/country/humen',
            '/city/humen',
            '/district/humen',
            '/commune/humen',
            '/village/humen'],[auth,checkRoleToViewScopeInfo],getInfoHumansWithIdArea)
// get list family of area using _id save in req.query (idCityRef,idDistrictRef,idCommuneRef,idVillageRef)
router.get(['/country/family',
            '/city/family',
            '/district/family',
            '/commune/family',
            '/village/family'],[auth,checkRoleToViewScopeInfo],getFamiliesWithIdArea)

//statistic 
router.get(['/country/statistics','/city/statistics','/district/statistics','/commune/statistics',
'/village/statistics'],[auth],getStatisticsInfoScopeById)


//get all districts belong to city{_id} or communes belong to district{_id} or village belong to{_id}
//{_id} save in req.query
router.get(['/district',
            '/commune',
            '/village'],[auth],async (req,res,next)=>{
                const typeOfScope = req.url.split('/')[1].split('?')[0]
                let belongToScopeRef 
                if(typeOfScope=='district') belongToScopeRef = req.query.idCityRef
                else if(typeOfScope=='commune') belongToScopeRef = req.query.idDistrictRef
                else if(typeOfScope=='village') belongToScopeRef = req.query.idCommuneRef
                else return res.status(400).send('invalid id')
                const areas = await Scope.find({typeOfScope:typeOfScope,
                                                belongToScopeRef:belongToScopeRef}).select("_id name");
                if (!areas) return res.status(400).send().send("Error");
                return res.status(200).send(areas);
            })


//get area by id
router.get(['/city/:id',
            '/district/:id',
            '/commune/:id',
            '/village/:id'],[auth],async (req,res,next)=>{
                if(!isValidObjectId(req.query.id))
                    return res.status(400).send('invalid id')
                const typeOfScope = req.url.split('/')[1]
                const areas = await Scope.find({typeOfScope:typeOfScope,
                                                _id:req.params.id}).select("_id name");
                if (!areas) return res.status(400).send().send("Error");
                res.status(200).send(areas);
            })



            

//get area by {_id}
router.get(['/city/:id','/district/:id','/commune/:id','/village/:id'],[auth],getAreaById)


//get address(country, city,district,commune,village)
router.get('/:id',getAddressById)

//get address(country, city,district,commune,village)
router.get('/',getFullAddressOfVillageById)

router.put('/changeInfomationOfArea',[auth,checkRoleToAddUser],changeInfomationOfAreaWithId)


module.exports =router;