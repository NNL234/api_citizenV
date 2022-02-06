const { Scope } = require("../models/address/scope")
const {User} = require("../models/user/user")
const mongoose= require('mongoose')
const { Address } = require("../models/address/address")
const bcrypt = require('bcrypt')
const ObjectId = mongoose.Types.ObjectId
const getUsersController = async function(req,res,next) {

        const user = await User.findOne({_id:req.decodedToken._id})
                                .populate({path:'idRoleRef',model:'Role'})
        if(!user) return res.status(400).send('invalid id')
        //if logged in user is A1
        if(req.decodedToken.role =='A1'){
            const roleRefOfAccount =user.idRoleRef.idRoleManageRef //A2
            //find accounts have role A2
            if(req.query.page<=0||!req.query.page) return res.status(404).send('not found')
            const page =req.query.page -1
            const numberOfDocumentsPerPage = 10
            const accounts =(await User.find({idRoleRef :roleRefOfAccount})
                                        .populate('idManagedScopeRef')
                                        .limit(numberOfDocumentsPerPage)
                                        .skip(numberOfDocumentsPerPage*page))
                                        .map(account=> {
                                            return {_id:account._id,
                                                    name:account.name,
                                                    username:account.username,
                                                    managedArea:account.idManagedScopeRef.name,
                                                    completed:account.completed,
                                                    declarable:account.declarable
                                                }
                                        })
            return res.status(200).send(accounts)
        }
        //find accounts managed by loggedInUser
        const accounts =(await User.find({addedBy:req.decodedToken._id})
                                    .populate('idManagedScopeRef'))
                                    .map(account=> {
                                        return {
                                                _id:account._id,
                                                name:account.name,
                                                username:account.username,
                                                managedArea:account.idManagedScopeRef.name,
                                                completed:account.completed,
                                                declarable:account.declarable,
                                            }
                                    })
        if(accounts.length)
            return res.status(200).send(accounts)
        return res.status(404).send('not found')
        
}
const getUserByIdController = async function(req,res,next) {

    if(!mongoose.isValidObjectId(req.params.id))
        return res.status(400).send("invalid id")
    const loggedInUser = await User.findOne({_id:req.decodedToken._id}).populate('idRoleRef idManagedScopeRef')
    if(!loggedInUser) return res.status(400).send('invalid id')
    let user
    if(req.decodedToken.role =='A1') 
        user = await User.findOne({idRoleRef:loggedInUser.idRoleRef.idRoleManageRef,_id:req.params.id})
                            .populate('idManagedScopeRef')
    else
        user = await User.findOne({
                                _id:new ObjectId(req.params.id),
                                addedBy: req.decodedToken._id,
                                idRoleRef: loggedInUser.idRoleRef.idRoleManageRef,
                            }).populate('idManagedScopeRef')
                        
    if(!user) 
        return res.status(404).send('not found any user managed by you match with id')
    return res.status(200).send({
                                name:user.name,
                                username:user.username,
                                managedArea:user.idManagedScopeRef.name,
                                completed:user.completed,
                                declarable:user.declarable
    })

} 
const getUserController = async function(req,res,next) {
    if(!mongoose.isValidObjectId(req.decodedToken._id))
        return res.status(400).send("invalid id")
        return User.findOne({_id:req.decodedToken._id}).populate('idManagedScopeRef')
        .then(result=>{
            
         res.status(200).send({
            name:result.name,
            username:result.username,
            managedArea:result.idManagedScopeRef.name,
            completed:result.completed,
            declarable:result.declarable,
            _id:result._id
         })
        })   
        .catch(err=> res.status(500).send(err))
}

const createUserController = async function(req,res,next) {

    const parttern1 =/^([0-9]{2}){1,4}$/ 
    const parttern2 = new RegExp('^'+req.decodedToken.username+"([0-9][0-9]){1}$")
    if(parttern1.test(req.body.username) &&req.decodedToken.role == 'admin')
        return res.status(400).send('invalid username')

    //if loggedInUser has role A1 and new username is not in range(01-63)
    if(req.decodedToken.role=='A1'&&(req.body.username.length !=2 || !parttern1.test(req.body.username)
        ||Number(req.body.username)==0||(Number(req.body.username)>63)))
        return res.status(400).send('username must have only 2 character from 01 to 64')
    
        //if loggedInUser is not admin or A1
    if(req.decodedToken.role!='admin' &&req.decodedToken.role!='A1'){
        if(!parttern2.test(req.body.username) ||/00$/.test(req.body.username))
            return res.status(400).send('username of new user must include your username and 2 digits(!00)')

    }
         
    const process =Promise.all([User.findOne({username:req.body.username}),
                    User.findOne({_id:req.decodedToken._id})
                    .populate({path: 'idRoleRef',model:'Role',
                                populate:{path:'idRoleManageRef',model:'Role'}})
                    ])
    
    const result = await process
    const usernameAlreadyInUse = result[0],loggedInUser = result[1]

    if(!loggedInUser) return res.status(400).send('invalid token')
    //find users managed by loggedInUser
    const ManagedScopesOfUser = await Scope.find({belongToIdScopeRef:loggedInUser.idManagedScopeRef})
    //if loggedInUser already created account for an area scopeName managed by him
    const alreadyExisted =ManagedScopesOfUser.length?
                            ManagedScopesOfUser.map(scope=> scope.name).includes(req.body.scopeName):
                            false

    if(usernameAlreadyInUse) return res.status(400).send('this id already in use')

    if(alreadyExisted && req.decodedToken.role !='admin') 
        return res.status(400).send('khu vuc nay nay da duoc ban tao tai khoan')
               
    let getScope ;
    // neu scope khac Viet Nam thi them scope moi 
    const typeOfManageScopeOfNewUser =loggedInUser.idRoleRef.idRoleManageRef.typeOfManageScope
    
    if(req.decodedToken.role != 'admin') {
        const newScope = new Scope ({
            name: req.body.scopeName,
            areaCode :req.body.username,
            typeOfScope:typeOfManageScopeOfNewUser,
            belongToIdScopeRef:loggedInUser.idManagedScopeRef,
        })
        const {err} =Scope.validate(newScope)
        if(err) throw err
        getScope =newScope.save()
    } 
    
    if(req.decodedToken.role == 'admin')  
        getScope = Scope.findOne({typeOfScope:'country'})
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);    
    getScope
        .then(result=>{
            const newUser = new User({
                addedBy:req.decodedToken._id,
                name:"cán bộ "+req.body.scopeName,
                idManagedScopeRef :result._id,
                idRoleRef :loggedInUser.idRoleRef.idRoleManageRef,
                username: req.body.username,
                password:password,
            })
            const {err} = User.validate(newUser)
            if(err) return err
            return newUser.save()
        })
        .then(result=> {
            const {name,username,completed,declarable} = result
            return res.status(201).send({name,username,completed,declarable})
        })
        .catch(err=> res.status(500).send(err))
    
}

//có thể change fields nào cũng được(them truong muon update) miễn là user quản lí account{_id}
const changePasswordController = async function(req,res,next) {

    if(req.query.id){
        if(!mongoose.isValidObjectId(req.query.id)) 
            return res.status(400).send('invalid id  4')
        const managedUser = await User.findOne({_id:req.query.id}).populate({path:'idRoleRef',model:'Role'})
        if(!managedUser) return res.status(404).send('not found')
        //nếu user la A1,account{id} la A2 hoặc user là người thêm  account{_id} 
        if(managedUser.addedBy.equals(req.decodedToken._id)||
            (managedUser.idRoleRef.name == 'A2'&& req.decodedToken.role =='A1')){
            const salt = await bcrypt.genSalt(10);
            const newPassword = await bcrypt.hash(req.body.newPassword, salt); 
            const result = await User.findOneAndUpdate({_id:new ObjectId(req.query.id)},{password:newPassword},{new:true})
            if(!result) return res.status(404).send("The user with the given ID was not found")
            return res.status(200).send("done")
        }
        return res.status(400).send('This user is not managed by you')
    }
    const result = await User.findOne({_id:req.decodedToken._id}).select('password')
    if(!result) return res.status(400).send("invalid id")
    const isValidPassword =await bcrypt.compare(req.body.oldPassword,result.password)
    if(!isValidPassword) return res.status(400).send('wrong old password')
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(req.body.newPassword, salt);
    return User.findOneAndUpdate({_id:req.decodedToken._id},{password:newPassword},{new:true})
            .then(response=> res.status(200).send("Done"))
            .catch(err=> res.send(500).send(err))

}

const changeDeclarePermissionByIdUser  = async function(req,res,next) {
    if(!mongoose.isValidObjectId(req.query.id)) 
        return res.status(400).send('invalid id ')
    const account = await User.findOne({_id:new ObjectId(req.query.id)}).populate({path:'idRoleRef',model:'Role'})
    if(!account) return res.status(400).send('invalid id ')
    if((account.addedBy.equals(req.decodedToken._id)) 
    || (req.decodedToken.role == 'A1'&& account.idRoleRef.name== 'A2')) {
        //neu khoa quyen khai bao thi khoa tat cac node do user quan ly va cac node cap duoi nua

        if(Boolean(req.body.declarable) == false)
            return User.updateMany({username:{$regex:'^'+ account.username}},{declarable:false})
                    .then(data=>res.status(200).send(data))
                    .catch(err=>res.status(500).send(err))
        else //neu mo quyen khai bao chi mo cho nguoi do
            return User.findOneAndUpdate({_id:req.query.id},{declarable:true},{new: true,select:"-password -_id "})
            .then(data=>res.status(200).send(data))
            .catch(err=>res.status(500).send(err))
    }

    return res.status(400).send('This user is not managed by you')

}

const removeUserController= async (req,res,next)=>{
    if(!req.params.id||!mongoose.isValidObjectId(req.params.id))
        return res.status(400).send('invalid id')
    const account= await User.findOne({_id:req.params.id}).populate('idManagedScopeRef')
        if(!account) return res.status(400).send("invalid id")
    if(account.addedBy.equals(req.decodedToken._id)||
     account.idManagedScopeRef.belongToIdScopeRef.equals(req.decodedToken.idManagedScopeRef))
        return Promise.all([User.findOneAndDelete({_id:account._id}),
                            Scope.findOneAndDelete({_id:account.idManagedScopeRef,areaCode:/^[0-9]/})])
                        .then(result=> res.status(200).send("success"))
                        .catch(err=> res.status(500).send(err))
    
}

const completeDeclareInfo =async (req,res,next)=>{
    const user =await User.findOneAndUpdate({_id:req.decodedToken._id,username:req.decodedToken.username},
                      {completed :true},{new:true})
    if(!user) return res.status(400).send('invalid id')
    return User.find({username:new RegExp("^"+user.username.slice(0,4)+"[0-9]{2}$")})
                .then(result=>{
                      let completed = true
                      result.forEach(user=>{
                            if(!user.completed) completed = false
                      })
                      if(completed)
                            return Promise.all([User.findOneAndUpdate({username:user.username.slice(0,4)},
                                                                      {completed:true},{new:true}),
                                              User.find({username:new RegExp("^"+user.username.slice(0,2)+"[0-9]{2}$")})])
                      return res.status(200).send('success')
                })
                .then(result=>{
                      if(!result.length) return result
                      let completed = true
                      result[1].forEach(user=>{
                            if(!user.completed) completed = false
                      })
                      if(completed)
                            User.findOneAndUpdate({username:user.username.slice(0,2)},{completed:true},{new:true})
                      return res.status(200).send('success')
                })



}
module.exports ={
    createUserController,
    getUserByIdController,
    changePasswordController,
    getUsersController,
    changeDeclarePermissionByIdUser,
    getUserController,
    removeUserController,
    completeDeclareInfo,
}