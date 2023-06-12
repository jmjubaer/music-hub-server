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

    //Verify related API
    app.post('/jwt',async(req,res) =>{
      const user = req.body;
      const token = jwt.sign(user,process.env.VITE_TOKEN,{expiresIn: '1h'})
      res.send({token});
    })

    const verifyAdmin = async(req, res, next) => {
      const email = req.decoded.email;
      const query = {email: email}
      const user = await userCollection.findOne(query);
      if(user?.role !== 'admin'){
        return res.status(403).send({error: true, message:"forbidden access"})
      }
      return next();
    }
    const verifyInstructor = async(req, res, next) => {
      const email = req.decoded.email;
      const query = {email: email}
      const user = await userCollection.findOne(query);
      if(user?.role === 'instructor'){
        return next();
      }
      return res.status(403).send({error: true, message:"forbidden access"})
    }

    // Admin related api 
    app.get('/user/admin',verifyJWT, async(req, res) => {
      const email = req.query.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      if(user && user?.role === 'admin') {
        res.send(true);
      }else{
        res.send(false);
      }
    })

    app.get('/allclasses',verifyJWT,verifyAdmin,async(req,res) => {
      const email = req.query.email;
      if(email){
        if(req.decoded.email === email){
          const result = await classCollection.find().sort({timeStamp: -1}).toArray();
          res.send(result);
        }else{
          res.status(403).send({message: "forbidden access"})
        }
      }else{
        res.send([])
      }
    })

    app.put('/approved/:id',verifyJWT,verifyAdmin,async(req,res) => {
      const updatedDoc = {
        $set: {
          status: 'approved',
        }
      }
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const option = {upsert: true};
      const result = await classCollection.updateOne(query,updatedDoc,option)
      res.send(result);
    })

    app.put('/denied/:id',verifyJWT,verifyAdmin,async(req,res) => {
      const updatedDoc = {
        $set: {
          status: 'denied',
        }
      }
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const option = {upsert: true};
      const result = await classCollection.updateOne(query,updatedDoc,option)
      res.send(result);
    })

    app.put('/feedback/:id',verifyJWT,verifyAdmin,async(req,res) => {
      const feedback = req.body;
      const updatedDoc = {
        $set: {
          ...feedback
        }
      }
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const option = {upsert: true};
      const result = await classCollection.updateOne(query,updatedDoc,option)
      res.send(result);
    })

    app.get('/allUsers',verifyJWT,verifyAdmin,async(req,res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    app.put('/makeAdmin/:id',verifyJWT,verifyAdmin,async(req,res) => {
      const updatedDoc = {
        $set: {
          role: "admin"
        }
      }
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const option = {upsert: true};
      const result = await userCollection.updateOne(query,updatedDoc,option)
      res.send(result);
    })
    app.put('/makeInstructor/:id',verifyJWT,verifyAdmin,async(req,res) => {
      const updatedDoc = {
        $set: {
          role: "instructor"
        }
      }
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const option = {upsert: true};
      const result = await userCollection.updateOne(query,updatedDoc,option)
      res.send(result);
    })

    //Instructor related api

    app.get('/user/instructor/:email',verifyJWT, async (req, res) => {
      const insEmail = req.params.email;
      const query = {email: insEmail};
      const user = await userCollection.findOne(query);
      if(user && user?.role === 'instructor') {
        res.send(true);
      }else{
        res.send(false);
      }
    })

    app.get('/myClasses',verifyJWT,verifyInstructor,async(req, res) => {
      const email = req.query.email;
      // console.log(email);
      const query = { email: email }
      const result = await classCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/addClass',verifyJWT,verifyInstructor,async(req,res) => {
      const newClass = req.body;
      const result = await classCollection.insertOne(newClass);
      res.send(result);
    })

    // Class related api =================================================
    app.get('/classes',async(req,res) => {
      const query = {status : "approved"}
      const result = await classCollection.find(query).sort({enrolled: -1}).toArray();
      res.send(result);
    })

    // user related api =================================================
    app.get('/instructors',async(req,res) => {
      const query = {role: "instructor"}
      const result = await userCollection.find(query).toArray();
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
      const email = req.query.email;
      if (email) {
        const decodedEmail = req.decoded.email;
        if(decodedEmail == email) {
          const query = {status: "pending",email: email};
          const result = await enrolledCollection.find(query).toArray();
          res.send(result);
        }else{
          res.status(403).send({message: "forbidden access"})
        }

    }else{
      res.send([])
    }
    })   

    app.delete('/selectedclass/:id',verifyJWT, async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await enrolledCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/enrolledclass',verifyJWT, async(req, res) => {
      const query = {status: "paid"};
      const result = await enrolledCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/selected',verifyJWT,async(req, res) => {
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
    app.put('/enrolled/:id',verifyJWT,async(req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const option = {upsert: true};
      const updatedDoc = {
        $set: {
          status: 'paid',
        }
      }
      const result = await enrolledCollection.updateOne(query,updatedDoc,option);
      res.send(result);
    })
    app.get('/confirmEnrolled/:id',verifyJWT,async(req,res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const product = await classCollection.findOne(filter);
      const option = {upsert: true};
      if(product){
        let quantity = 0;
        if(product?.enrolled){
          quantity =  product?.enrolled + 1
        }
        else{
          quantity = 1;
        }
        const updatedDoc = {
          $set:{
            enrolled: quantity
          }
        }
        const result = await classCollection.updateOne(filter,updatedDoc,option);
        res.send(result);
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