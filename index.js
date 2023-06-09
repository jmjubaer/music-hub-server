const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
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



    // Class related api =================================================
    app.get('/classes',async(req,res) => {
      const result = await classCollection.find().sort({enrolled: -1}).toArray();
      res.send(result);
    })

    app.get('/git',async(req,res) => {
      const email = req.query.email;
      const query = {email: email};
      const result = await classCollection.find(query).toArray();
      res.send(result);
    })

    // user related api =================================================
    app.get('/instructors',async(req,res) => {
      const query = {role: "instructor"}
      const result = await userCollection.find().toArray();
      res.send(result);
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