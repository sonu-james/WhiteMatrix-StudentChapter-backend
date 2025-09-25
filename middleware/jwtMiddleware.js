

//import jsonwebtoken
const jwt=require('jsonwebtoken')
//middleware is used to create to varify jsonwebtoken
const jwtMiddleware = (req, res, next) => {
    //logic
    console.log('inside jwtMiddleware');
    //access  token
    const token = req.headers["authorization"].split(' ')[1]
    // console.log(token);

    //verify
    try{
        const jwtResponse = jwt.verify(token,'supersecretKey')
        console.log(jwtResponse);
        req.payload=jwtResponse.userId
        next()
    }catch(error){
        res.status(401).json('Authorization failed ... plzz login ',error)
    }
   
}
module.exports = jwtMiddleware