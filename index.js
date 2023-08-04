const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors');
const port = process.env.PORT || 5000
const jwt=require('jsonwebtoken');
app.use(cors())
app.use(express.json())
require('dotenv').config()

app.get('/',(req,res)=>{
    res.send('Car Doctor')
})

const VerifyJwt=(req,res,next)=>{
  const authorization=req.headers.authorization
  if(!authorization){
    return res.status(401).send({error:true,message:'unauthorized access'})
  }
  const token=authorization.split(' ')[1]
  jwt.verify(token,process.env.VITE_JWT,(error,decode)=>{
    if(error){
      return res.status(401).send({error:true,message:'unauthorized access'})
    }
    req.decode=decode
    next()
  })
}
const uri = `mongodb+srv://${process.env.VITE_USER}:${process.env.VITE_PASS}@cluster0.bzshal4.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const serviceCollection=client.db('car-doctor').collection('service')
    const userCollection=client.db('car-doctor').collection('user')
    const bookingCollection=client.db('car-doctor').collection('booking')
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    //  JWT
    app.post('/jwt',async(req,res)=>{
      const data=req.body 
      const token=jwt.sign(data,process.env.VITE_JWT,{expiresIn:'1d'})
      res.send(token)
    })
    // verifyAdmin
    const verifyAdmin=async(req,res,next)=>{
      const email=req.decode.email 
      const query={email:email}
      const user=await userCollection.findOne(query)
      if(user?.role!=='admin'){
        return res.status(401).send({error:true,message:'forbidden message'})
      }
      next()
    }
    //get all Services
    app.get('/service',async(req,res)=>{
      const result=await serviceCollection.find().toArray()
      res.send(result)
    })

    // getting a single service 
    app.get('/singleService/:id',async(req,res)=>{
      const id=req.params.id 
      const query={_id:new ObjectId(id)}
      const result=await serviceCollection.findOne(query)
      res.send(result)
    })

    // post singUP userData
    app.post('/postUser',async(req,res)=>{
      const data = req.body.singUpDetails;
      const result=await userCollection.insertOne(data)
      res.send(result)
    })

    // post user booking 
    app.post('/postBooking', async(req,res)=>{
      const data=req.body.bookingData 
      const result=await bookingCollection.insertOne(data)
      res.send(result)
    })

    // getting all user 
    app.get('/getAllUser',VerifyJwt,verifyAdmin, async(req,res)=>{
      const result=await userCollection.find().toArray()
      res.send(result)
    })
    // delete a user
    app.delete('/deleteUser/:email',VerifyJwt,verifyAdmin,async(req,res)=>{
      const email=req.params.email
      const query={email:email}
      const result=await userCollection.deleteOne(query)
      res.send(result)
    })
    // adding service by admin
    app.post('/addService',VerifyJwt,verifyAdmin,async(req,res)=>{
      const data=req.body
      const result=await serviceCollection.insertOne(data)
      res.send(result)
    })

    // make user admin
    app.patch('/makeAdmin/:email',VerifyJwt,verifyAdmin, async(req,res)=>{
      const data=req.params.email 
      const query={email:data}
      const upDate={
        $set:{
          role:'admin'
        }
      }
      const result=await userCollection.updateOne(query,upDate)
      res.send(result)
    })

    // checking user admin or not 
    app.get('/isUserAdmin/:email',VerifyJwt, async(req,res)=>{
      const email=req.params.email 
      // if(email!==req.decode.email){
      //   res.send({admin:false})
      // }
      const query={email:email}
      const user=await userCollection.findOne(query)
      const result= {admin:user?.role==='admin'}
      res.send(result)
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port)