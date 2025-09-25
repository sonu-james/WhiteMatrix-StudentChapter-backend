//import mangoose
const mongoose=require('mongoose')

const connectionString =process.env.DATABASE
mongoose.connect(connectionString).then(()=>{
    console.log('mongo db running successfully');
}).catch((err)=>{
    console.log(`not connected due to${err}`);
})