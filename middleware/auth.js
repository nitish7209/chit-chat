const usermodel = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { error } = require('winston');


module.exports.authuser = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.log("Unauthorized ! =>  Must need to login or register !")
        return res.status(401).json({ message: 'Unauthorized !' })
    }


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await usermodel.findById(decoded._id)
        req.user = user
        return next();
    } catch (error) {
    error.log(`Token verification failed: ${error.message}`);
    return res.status(401).json({ message: 'Token verification failed  or Unauthorized' });
    }

}

