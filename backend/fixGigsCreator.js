// fixGigsCreator.js
const mongoose = require("mongoose");
const Gig = require("./src/models/Gig");

const MONGO = process.env.MONGO_URI || "YOUR_MONGO_URI_HERE"; // replace if you don't use env
const PROVIDER_ID = "68e178dc8fa97afd5c118b0a"; // <-- replace with the provider id you want assigned

async function run() {
  await mongoose.connect(MONGO);
  console.log("Connected to Mongo");

  // list gigs missing createdBy
  const missing = await Gig.find(
    { createdBy: { $exists: false } },
    "_id title"
  ).lean();
  console.log("Gigs missing createdBy:", missing);

  if (missing.length === 0) {
    console.log("No gigs to fix. Exiting.");
    await mongoose.disconnect();
    return;
  }

  // FIX: assign PROVIDER_ID to all missing gigs
  const res = await Gig.updateMany(
    { createdBy: { $exists: false } },
    { $set: { createdBy: new mongoose.Types.ObjectId(PROVIDER_ID) } }
  );

  console.log(
    "Updated count:",
    res.modifiedCount ?? res.nModified ?? res.modified ?? res
  );
  await mongoose.disconnect();
  console.log("Done");
}

run().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
