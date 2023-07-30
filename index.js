const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors');
const port = process.env.PORT || 5000
app.use(cors())
app.use(express.json())
require('dotenv').config()

app.get('/',(req,res)=>{
    res.send('Car Doctor')
})


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
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port)