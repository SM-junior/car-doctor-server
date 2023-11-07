require('dotenv').config()
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
var jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n2wd0zs.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT=(req,res,next)=>{
  const authorization=req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true, message:'unauthorized access'})
  }
  const token=authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({error:true, message:'unauthorized access'})
    }
    req.decoded=decoded;
    next()
  })
  
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const serviceCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('bookings');

    //jwt
   app.post('/jwt',(req,res)=>{
    const user=req.body;
    console.log(user);
    const token=jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1h'})
    console.log(token);
    res.send({token})

   })

    //getting all service data from database
    app.get('/services', async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray()
      res.send(result)
    })

    //getting a single service data from all service data from database
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const options = {
        // _id automatic asbe, title & price ta cai tai, bakigula jemon description img-url agula ke cai na, eta khub important
        projection: { title: 1, price: 1, img: 1 }
      };

      const result = await serviceCollection.findOne(query, options)
      res.send(result)
    })

    //inserting single booking data from user interface to database
    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking)
      res.send(result)
    })

    //getting some booking data from database by booking with same email
    app.get('/bookings', verifyJWT, async (req, res) => {
      const decoded=req.decoded
      console.log(decoded);
      if(decoded.email !==req.query.email){
        return res.status(403).send({error: true, message:'Forbidden access'})
      }

      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const cursor = bookingCollection.find(query)
      const result = await cursor.toArray();
      res.send(result)
    })

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.deleteOne(query)
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('doctor is running')
})

app.listen(port, () => {
  console.log(`doctor is running on port: ${port}`);
})
