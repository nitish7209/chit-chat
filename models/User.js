const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select:false
    }
}, {
    timestamps: true
});

userSchema.methods.generatedAuthToken = function (){
    const token = jwt.sign(
        { _id: this._id},
        process.env.JWT_SECRET,
        {expiresIn:'24h'}
    );
    return token;
}

userSchema.methods.comparePassword = async function(Password) {
    try {
        return await bcrypt.compare(Password, this.password);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};


userSchema.statics.hashPassword = async function (password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

userSchema.statics.hashPassword 



module.exports = mongoose.model('User', userSchema); 