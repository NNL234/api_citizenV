const { createUserController, getUserByIdController, changePasswordController,
     getUsersController, changeDeclarePermissionByIdUser, getUserController,
      removeUserController, completeDeclareInfo} = require('../controllers/user')
const auth = require('../middleware/auth')
const checkDeclarablePermission = require('../middleware/checkDeclarablePermission')
const checkRoleToAddUser = require('../middleware/checkRoleToAddUser')
const isB1 = require('../middleware/isB1')
const router = require('express').Router()
//get users that logged in user added
router.get('/all',[auth,checkRoleToAddUser],getUsersController)
//get user by id(ObjectId) that logged in user added
router.get('/:id',[auth],getUserByIdController)
//add one user 
router.post('/',[auth,checkRoleToAddUser,checkDeclarablePermission],createUserController)
//change password of logged in user
router.put('/change-password',[auth],changePasswordController)
//change password of user by id(type:ObjectId)
router.put('/change-password',[auth,checkRoleToAddUser,checkDeclarablePermission],changePasswordController)

router.put('/complete-declare-info',[auth,isB1],completeDeclareInfo)
//change declare permission
router.put('/change-declare-permission',[auth,checkDeclarablePermission],changeDeclarePermissionByIdUser)
//get all user that logged in user manage
router.get('/',[auth],getUserController)
//delete user that logged in user manage
router.delete('/:id',[auth,checkRoleToAddUser,checkDeclarablePermission],removeUserController)

module.exports = router