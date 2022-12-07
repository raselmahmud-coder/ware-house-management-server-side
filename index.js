const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const multer = require("multer");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 4000;
const app = express();
app.use(cors());
app.use(express.json());

const ImageModel = require("./image.modal");
// storage
const Storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({
  storage: Storage,
}).single("testImage");

app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
    } else {
      const newImage = new ImageModel({
        name: req.body.name,
        image: {
          data: req.file.filename,
          contentType: "image/png",
        },
      });

      newImage
        .save()
        .then(() => res.send("successfully loaded"))
        .catch((err) => console.log(err));
    }
  });
});
/*image uploading and storage to db*/
//  auth verify function using Json web token
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(req?.headers);
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access request" });
  }
  const token = authHeader.split(" ")[1];
  // console.log("token",token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    console.log("error", err);
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    } else {
      console.log("deCoded", decoded);
      req.decoded = decoded;
      next();
    }
  });
}
// root port create
app.get("/", (req, res) => {
  res.send("this is King furniture server");
});
app.listen(port, () => {
  console.log(`king furniture listing ${port}`);
});

// Mongo db connection
const uri = `${process.env.API_HOST}`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("connected db");
    const inventoryCollection = client
      .db("InventoryKing")
      .collection("inventories");
    /* Authorization using Json Web Token */
    app.post("/login", async (req, res) => {
      const user = req.body;
      console.log(user);
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send(accessToken);
    });
    // get a specific user info query by email
    app.get("/order", verifyJWT, async (req, res) => {
      const decodedEmail = req?.decoded?.email;

      const { email } = req.query;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = inventoryCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
        console.log("email is valid");
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    });

    // insert an item api
    app.post("/add-item", async (req, res) => {
      const { addItem } = req.body;
      console.log(addItem);
      const result = await inventoryCollection.insertOne(addItem);
      res.send(result);
    });

    app.get("/inventories", async (req, res) => {
      const query = {};
      const cursor = inventoryCollection.find(query);
      const result = await cursor.toArray();

      res.send(result);
    });
    //   get a specific data item
    app.get("/inventory/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: ObjectId(id) };
      const cursor = await inventoryCollection.findOne(query);
      res.send(cursor);
    });
    //   update a specific data
    app.put("/inventory/:id", async (req, res) => {
      const { id } = req.params;
      const { updateQuantity } = req.body;
      console.log(updateQuantity, id);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          quantity: updateQuantity,
        },
      };
      const result = await inventoryCollection.updateOne(
        filter,
        updatedDoc,
        options,
      );
      res.send(result);
    });
    // delete the item data
    app.delete("/manageInventory/:id", async (req, res) => {
      const { id } = req.params;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const result = await inventoryCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    console.log("finally section");
  }
}
run().catch(console.dir);
