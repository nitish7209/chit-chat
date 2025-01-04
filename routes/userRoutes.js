const express = require('express');
const router = express.Router();
// const {body} = require("express-validator")      use it later
const userController = require('../controllers/userController');
const { authuser } = require('../middleware/auth');

router.post('/Register', userController.createUsers);

router.post('/Login', userController.getUser);

router.get('/logout',authuser,userController.logoutuser);

router.get('/Profile', authuser, userController.profileuser)

router.post('/UpdateProfile', authuser, userController.updateprofile)

router.get('/verify',  userController.verifyUserToken);

router.get('/allUsers',authuser, userController.getAllUsers);

router.get('/Users/:id',authuser, userController.getSingleUser);






module.exports = router; 