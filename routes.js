//1)import express
const express=require('express')
//import userController file
const userController=require('./controller/userController')

//import jwtmidddleware
const jwt=require('./middleware/jwtMiddleware')

//2)create an object for router class
const router =new express.Router()
//3)set up path for each request from view

//register request
router.post('/register',userController.registerController)

//login 
router.post('/login',userController.loginController)

// //edit profile 
// router.put('/edit-profile',jwt,multerConfig.single('profile'),userController.editProfileController)

//4)export the router
module.exports=router