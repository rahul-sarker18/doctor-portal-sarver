const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// middle wear
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("doctor portal server opne");
});
//jwt midelwaire
function jwtveryfied(req, res, next) {
  const autheize = req.headers.authorization;

  if (!autheize) {
    return res.status(401).send("unauthorize");
  }
  const token = autheize.split(" ")[1];

  jwt.verify(token, process.env.JOT_TOKEN, function (error, decoded) {
    if (error) {
      return res.status(403).send({ message: "forbedin accese" });
    }
    req.decoded = decoded;

    next();
  });
}

// usernaem : doctor-portal
//password  : JqClHjx14dtJSZmh

// cliction :   appinment-clictan
//database :  doctor-portal

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@cluster0.skeb3xq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const appinment_claction = client
      .db("doctor-portal")
      .collection("appinment-clictan");
    const bookingServer = client.db("doctor-portal").collection("bokings");
    const userscollection = client.db("doctor-portal").collection("users");

    //JOOT TOKEN START
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      // console.log("60" ,email);

      const user = await userscollection.findOne(query);
      console.log("60", user);
      if (user) {
        const token = jwt.sign({ email }, process.env.JOT_TOKEN, {
          expiresIn: "12h",
        });
        res.send({ accesstoken: token });
      }
      console.log(user);
      res.status(403).send({ accesstoken: "" });
    });

    // get the appoinment option
    app.get("/appinmentOption", async (req, res) => {
      const query = {};
      const dates = req.query.date;
      console.log(dates);
      const result = await appinment_claction.find(query).toArray();

      //be cearfull

      const bookingQuiry = { date: dates };
      const alreadyBooked = await bookingServer.find(bookingQuiry).toArray();

      result.forEach((option) => {
        // console.log(option);
        const optionBooking = alreadyBooked.filter(
          (book) => book.name === option.name
        );
        const bookingSlote = optionBooking.map((book) => book.slot);
        const remingslots = option.slots.filter(
          (slot) => !bookingSlote.includes(slot)
        );
        option.slots = remingslots;
      });
      res.send(result);
    });

    // get the email  query booking
    app.get("/bokings", async (req, res) => {
      const email = req.query.email;
      // const decoded = req.decoded.email;

      // if(email !== decoded){
      //   return res.status(403).send({message : 'forbiden accesec'})
      // }
      // console.log(decoded);

      const query = { email: email };
      const result = await bookingServer.find(query).toArray();
      res.send(result);
    });

    // post the booking
    app.post("/bokings", async (req, res) => {
      const boking = req.body;
      const query = {
        name: boking.name,
        email: boking.email,
        date: boking.date,
      };

      const alreadybooked = await bookingServer.find(query).toArray();

      // console.log(alreadybooked);

      if (alreadybooked.length > 0) {
        const message = `you already have a booked on ${boking.name}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await bookingServer.insertOne(boking);
      res.send(result);
    });

    //get all users
    app.get("/users", async (req, res) => {
      const query = {};
      const result = await userscollection.find(query).toArray();
      res.send(result);
    });

    // user ingormaiton post
    app.post("/user", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const result = await userscollection.insertOne(user);
      res.send(result);
    });

    //admin panel
    app.put("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: ObjectId(id) };
      console.log(filter);
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
        const result = await userscollection.updateOne(filter , updatedDoc , options);
        res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`docto-portalaserver-run port ${port}`);
});
