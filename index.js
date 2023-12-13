const express = require("express");
// const { MongoClient, ServerApiVersion } = require('mongodb');

require('dotenv').config();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json())






app.get('/', async(req, res) => {
    res.send("Server running");
})

app.listen(port, (err) => {
    console.log("Running on port", port);
})
