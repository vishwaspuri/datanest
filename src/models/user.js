const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')

const userSchema = new mongoose.Schema({
    "name": {
        "type": String,
        "require": true,
        "trim": true
    },
    "email" :{
        "type": String,
        "required": true,
        "trim": true,
        "unique": true,
        "lowercase": true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is not valid.')
            }
        }
    },
    "password": {
        "type": String,
        "required": true,
        "trim": true,
        "minlength": 7
    },
    "tokens": [{
        "token": {
            "type": String,
            "required": true
        }
    }]
}, {
    "timestamps": true
})

userSchema.virtual('Collection', {
    "ref": "Collection",
    "localField": "_id",
    "foreignField": "owner"
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

userSchema.methods.generateAuthToken =async function () {
    const user = this
    const token = jwt.sign({"_id": user._id.toString()}, 'covifight')

    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('User not found')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (isMatch) {
        throw new Error('Unable to login.')
    }

    return user
}

userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
