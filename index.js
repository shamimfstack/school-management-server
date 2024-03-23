const express = require("express");
const {
  MongoClient,
  ServerApiVersion,
  MongoCryptAzureKMSRequestError,
} = require("mongodb");

require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      // 'https://school-management-25b37.web.app',
      // 'https://school-management-25b37.firebaseapp.com'
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.24pgglg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("schoolDB").collection("users");
    const studentCollection = client.db("schoolDB").collection("students");
    const teachersCollection = client.db("schoolDB").collection("teachers");
    const announcementCollection = client.db("schoolDB").collection("announcements");

    // jwt related api
    // create token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("logged in user", user);
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      // res.cookie('token', token, {
      //     httpOnly: true,
      //     secure: process.env.NODE_ENV === 'production',
      //     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      //     })
      //   .send({status: 'success'})

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "none",
        })
        .send(token);
    });

    // verify token
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers.authorization);
      console.log(req.headers);
      console.log(req.headers.authorization);
      if (!req.headers.authorization) {
        return res
          .status(401)
          .send({ message: "unauthorized access, authorization not found" });
      }

      const token = req.headers.authorization.split(" ")[1];
      console.log("hello", token);
      // if(!token) {
      //   return res.status(401).send({message: 'unauthorized access'})
      // }

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .send({ message: "unauthorized access, token not verified" });
        }
        req.decoded = decoded;
        console.log(req.decoded);
        next();
      });
    };

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      console.log("verify admin", email);
      const query = { email: email };
      const user = await userCollection.findOne(query);
      console.log("checking user", user);
      // checking user is admin or not
      const isAdmin = user?.role === "admin";
      // if user is not admin
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      // if user is admin
      console.log("hello checking");
      next();
    };

    // user related api
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // admin creation api
    app.get(
      "/users/admin/:email",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        console.log("nothing found", req.params);
        const email = req.params?.email;
        if (email !== req.decoded.email) {
          console.log("decoded email", email);
          return res
            .status(403)
            .send({ message: "forbidden access, decoded email not found" });
        }

        const query = { email: email };
        const user = await userCollection.findOne(query);
        console.log(user);

        let admin = false;

        if (user) {
          admin = user.role === "admin";
        }
        console.log(admin);
        res.send({ admin });
      }
    );

    // announcement related api

    app.get("/announcements", async(req, res) => {
      const result = await announcementCollection.find().toArray();
      res.send(result);
    })

    app.post("/createAnnouncements", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await announcementCollection.insertOne(data);
      res.send(result);
    })

    // teacher related api
    app.get("/allTeachers", async(req, res) => {
      const result = await teachersCollection.find().toArray();
      res.send(result);
    })

    app.post("/addTeachers", async(req, res) => {
      const newTeacher = req.body;
      const result = await teachersCollection.insertOne(newTeacher);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Server running");
});

app.listen(port, (err) => {
  console.log("Running on port", port);
});
