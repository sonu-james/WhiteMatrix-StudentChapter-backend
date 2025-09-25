
const users = require("../model/userModel");
const jwt = require('jsonwebtoken')

//register
exports.registerController = async (req, res) => {
    const { username, email, password } = req.body
    console.log(username, email, password);
    try {
        const existingUser = await users.findOne({ email })
        if (existingUser) {
            res.status(406).json('Account already existed')
        }
        else {
            const newUser = new users({
                username,
                email,
                password,
                github: "",
                linkedin: "",
                profile: ""
            })
            //save()-to store the data in mongodb
            await newUser.save()
            res.status(200).json(newUser)
        }

    } catch (error) {
        res.status(401).json(`registration failed due to ${error}`)
    }
    // res.status(200).json('register request received')
}

//login
exports.loginController = async (req, res) => {
    const { email, password } = req.body
    try {
        const existingUser = await users.findOne({ email, password })
        if (existingUser) {
            const token=jwt.sign({userId:existingUser._id},'supersecretKey')
            res.status(200).json({existingUser,token})
        }
        else {
            res.status(406).json('Invalid emailid or password')
        }
    } catch (error) {
        res.status(401).json(error)

    }
}