// backend/seed.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

// ===============================
// Load all models automatically
// ===============================

const modelsDir = path.join(__dirname, "models");
const models = {};

if (fs.existsSync(modelsDir)) {
  fs.readdirSync(modelsDir).forEach((file) => {
    if (file.endsWith(".js")) {
      try {
        const modelName = file.replace(".js", "");
        models[modelName] = require(`./models/${file}`);
      } catch (err) {
        console.log(`Skipping model ${file}`);
      }
    }
  });
}

// ===============================
// Required Model
// ===============================

const User = models.User || mongoose.model("User");

// ===============================
// Seed Function
// ===============================

const runSeed = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb://127.0.0.1:27017/dokkhota"
    );

    console.log("✅ Connected to MongoDB");

    // ===============================
    // Fetch Registered Users
    // ===============================

    const users = await User.find();

    if (!users.length) {
      console.log("❌ No registered users found.");
      console.log("Please register at least one account first.");

      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Found ${users.length} registered user(s).`);

    // ===============================
    // Project Member Admin Accounts
    // ===============================

    const adminEmails = [
      "kazi.sabika.juwairia@g.bracu.ac.bd",
      "faiyaj.masrur@g.bracu.ac.bd",
      "md.muhtasim.irtija@g.bracu.ac.bd",
      "nusrat.jahan@g.bracu.ac.bd"
    ];

    // ===============================
    // Check Registered Users
    // ===============================

    for (const user of users) {
      const email = user.email.toLowerCase();

      // Make only the four project members admins
      if (adminEmails.includes(email)) {
        if (user.role !== "admin") {
          user.role = "admin";
          await user.save();

          console.log(`✅ ${user.email} promoted to Admin`);
        } else {
          console.log(`✅ ${user.email} is already an Admin`);
        }
      }
    }

    // ===============================
    // No Fake Notifications
    // ===============================

    console.log(
      "ℹ️ Notifications will be created naturally through the application."
    );

    // ===============================
    // No Fake Sessions
    // ===============================

    console.log(
      "ℹ️ Sessions will be created naturally when users book/complete sessions."
    );

    // ===============================
    // No Fake Credit Transactions
    // ===============================

    console.log(
      "ℹ️ Credit transactions will be created naturally through application activity."
    );

    // ===============================
    // SEED COMPLETE
    // ===============================

    console.log("\n🎉 Seed completed successfully!");
    console.log("✅ Admin accounts checked");
    console.log("✅ Existing user data preserved");
    console.log("✅ No fake notifications created");
    console.log("✅ No fake sessions created");
    console.log("✅ No fake credit transactions created");

    await mongoose.connection.close();

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Error while seeding data:");
    console.error(err);

    await mongoose.connection.close();

    process.exit(1);
  }
};

// ===============================
// Run Seed
// ===============================

runSeed();