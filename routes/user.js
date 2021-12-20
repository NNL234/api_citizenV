const { updateAddresses } = require('../controllers/update/updateAddresses')
const { createUserController, getUserByIdController, changePasswordController,
     getUsersController, changeDeclarePermissionByIdUser, getUserController,
      removeUserController } = require('../controllers/user')
const auth = require('../middleware/auth')
const checkDeclarablePermission = require('../middleware/checkDeclarablePermission')
const checkRoleToAddUser = require('../middleware/checkRoleToAddUser')
const router = require('express').Router()
router.get('/update-address',updateAddresses)
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
//change declare permission
router.put('/change-declare-permission',[auth,checkDeclarablePermission],changeDeclarePermissionByIdUser)
//get all user that logged in user manage
router.get('/',[auth],getUserController)
//delete user that logged in user manage
router.delete('/:id',[auth,checkRoleToAddUser,checkDeclarablePermission],removeUserController)
module.exports = router