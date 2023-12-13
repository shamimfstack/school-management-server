const express = require("express");
const { MongoClient, ServerApiVersion } = require('mongodb');

require('dotenv').config();
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
      'http://localhost:5173',
      // 'https://concept-1-bbffd.web.app',
      // 'https://concept-1-bbffd.firebaseapp.com'

  ],
  credentials: true
}))
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.24pgglg.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    const userCollection = client.db("schoolDB").collection("users");
    const studentCollection = client.db("schoolDB").collection("students");

    // jwt related api
    // create token
    app.post('/jwt', async(req, res) => {
      const user = req.body;
      console.log(user);
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, 
          {expiresIn: '1h'});

        // res.cookie('token', token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        //     })
        //   .send({status: 'success'})
     
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'none'
      })
      .send({status: "true"})
  })

    // user related api
    app.post('/users', async(req, res) => {
        const user = req.body;

        const query = { email: user.email }
        const existingUser = await userCollection.findOne(query)
        if(existingUser) {
          return res.send({ message: "User already exists", insertedId: null})
        }
        const result = await userCollection.insertOne(user)
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





app.get('/', async(req, res) => {
    res.send("Server running");
})

app.listen(port, (err) => {
    console.log("Running on port", port);
})
