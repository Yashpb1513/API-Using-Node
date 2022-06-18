const router = require("express").Router();
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");
const URL = "mongodb://localhost:27017";
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const client = new MongoClient(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zwb4d.mongodb.net/?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const db = "DTprac";
async function connect() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(err);
  }
}
connect();
async function getEvents(id) {
  let events;
  const prop_id = new ObjectId(id);
  try {
    if (id)
      events = await client
        .db(db)
        .collection("events")
        .findOne({ _id: prop_id });
    else events = await client.db(db).collection("events").find({}).toArray();
  } catch (err) {
    console.log(err);
  }
  return events;
}

async function getLatestEvents(limit, page) {
  let events;
  if(page === 1){
    try {
      events = await client
        .db(db)
        .collection("events")
        .find({})
        .sort({ _id: -1 })
        .limit(limit)
        .toArray();
    } catch (err) {
        console.log(err);
        }
  }
else{
    try {
      events = await client
        .db(db)
        .collection("events")
        .find({})
        .sort({ _id: -1 })
        .skip(limit * (page - 1))
        .limit(limit)
        .toArray();
    } catch (err) {
        console.log(err);
        }
}
  return events;
}

async function updateEvent(id, event) {
  const prop_id = new ObjectId(id);
  try {
    await client
      .db(db)
      .collection("events")
      .updateOne({ _id: prop_id }, { $set: event });
  } catch (err) {
    console.log(err);
  }
}

async function deleteEvent(id) {
  const prop_id = new ObjectId(id);
  try {
    await client.db(db).collection("events").deleteOne({ _id: prop_id });
  } catch (err) {
    console.log(err);
  }
}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({ storage: storage });

var multipleUpload = upload.fields([{ name: "files", maxCount: 4 }]);

async function storeEvent(event) {
  try {
    await client.db(db).collection("events").insertOne(event);
  } catch (err) {
    console.log(err);
  }
}

router.get("/events", (req, res) => {
  let id = req.query.id;
  let type = req.query.type;
  let page = 1;
    if (req.query.page) page = req.query.page;
  if (type === "latest") {
    let limit = parseInt(req.query.limit);
    getLatestEvents(limit, page)
      .then((events) => {
        res.status(200).send(events);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  } else {
    getEvents(id)
      .then((events) => {
        res.status(200).send(events);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  }
});

router.post("/events", multipleUpload, (req, res) => {
  let event_data = req.body;
  const received = req.files.files;
  const images = [];
  if (received.length > 0) {
    for (let i = 0; i < received.length; i++) {
      let file = fs.readFileSync("./uploads/" + received[i].filename);
      let contentType = "image/png";
      images.push({ data: file, contentType: contentType });
    }
    event_data.images = images;
  }
  storeEvent(event_data)
    .then(() => {
      res.status(200).send("Event added successfully");
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.put("/events/:id", (req, res) => {
  let event_data = req.body;
  if (req.files) {
    const received = req.files.files;
    const images = [];
    if (received.length > 0) {
      for (let i = 0; i < received.length; i++) {
        let file = fs.readFileSync("./uploads/" + received[i].filename);
        let contentType = "image/png";
        images.push({ data: file, contentType: contentType });
      }
      event_data.images = images;
    }
  }
  updateEvent(req.params.id, event_data)
    .then(() => {
      res.status(200).send("Event updated successfully");
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.delete("/events/:id", (req, res) => {
  let id = req.params.id;
  if (id) {
    deleteEvent(id)
      .then(() => {
        res.status(200).send("Event deleted successfully");
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  } else {
    res.status(500).send("No event id provided");
  }
});

module.exports = router;
