const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express")
const cors = require("cors")
const port = process.env.PORT || 4000
const app = express();
app.use(cors())
app.use(express.json())

// root port create
app.get('/', (req, res) => {
    res.send("this is King furniture server")
})
app.listen(port, () => {
    console.log(`king furniture listing ${port}`);
})
// yAuJS4zT5F1OyMtP
// king_furniture
// Mongo db connection

const uri = "mongodb+srv://king_furniture:yAuJS4zT5F1OyMtP@cluster0.w1eom.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();

    const inventoryCollection = client.db("InventoryKing").collection("inventories")
      app.get('/inventories', async (req, res) => {
          const query = {};
          const cursor =  inventoryCollection.find(query);
          const result = await cursor.toArray();

          res.send(result)
      })
      
      app.get("/inventory/:id", async (req, res) => {
          const {id} = req.params;
          console.log(id);
          const query = {_id: ObjectId(id)};
          const cursor = await inventoryCollection.findOne(query);
        //   const result = await cursor.toArray();
          res.send(cursor);
      })
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
