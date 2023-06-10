const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken')
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "Unauthorize access"})
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token,process.env.VITE_TOKEN,(err,decoded) =>{
    if(err){
      return res.status(403).send({ message: "Forbidden access"})
    }else{
      req.decoded = decoded;
      next();
    }
  })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.VITE_USER}:${process.env.VITE_PASS}@cluster0.wxf5f5n.mongodb.net/?retryWrites=true&w=majority`;

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
    const classCollection = client.db('Music-hub').collection('class');
    const userCollection = client.db('Music-hub').collection('user');
    const enrolledCollection = client.db('Music-hub').collection('enrolled');

    //JWT related API
    app.post('/jwt',async(req,res) =>{
      const user = req.body;
      const token = jwt.sign(user,process.env.VITE_TOKEN,{expiresIn: '1h'})
      res.send({token});
    })


    // Class related api =================================================
    app.get('/classes',async(req,res) => {
      const result = await classCollection.find().sort({enrolled: -1}).toArray();
      res.send(result);
    })


    // user related api =================================================
    app.get('/instructors',async(req,res) => {
      const query = {role: "instructor"}
      const result = await userCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/user',async(req,res) => {
      const result = await userCollection.find().toArray();
      res.send(result); 
    })

    app.post('/user',async(req,res) => {
      const user = req.body;
      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({message: "User already exists"})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    // Enrolled related api
    app.get('/selectedclass',verifyJWT, async(req, res) => {
      const query = {status: "pending"};
      const result = await enrolledCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/enrolledclass',verifyJWT, async(req, res) => {
      const query = {status: "paid"};
      const result = await enrolledCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/enrolled',async(req, res) => {
      const classInfo = req.body;
      const query = {
        productId: classInfo.productId,
        email: classInfo.email
      }
      const isSelected = await enrolledCollection.find(query).toArray();
      if(!isSelected.length > 0) {
        const result = await enrolledCollection.insertOne(classInfo);
        res.send(result);
      }else{
        res.send({selected: true});
      }
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',async(req, res)=> {
    res.send('Summer Camp server Running ........')
})
app.listen(port,() => {
    console.log("Summer Camp server running on port", port);
});