// backend/seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const SkillListing = require("./models/SkillListing");
const Booking = require("./models/Booking");
const Session = require("./models/Session");
const CreditTransaction = require("./models/CreditTransaction");
const Notification = require("./models/Notification");
const Category = require("./models/Category");
const Review = require("./models/Review");

const runSeed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dokkhota";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB at:", mongoUri);

    const defaultPassword = "Password123!";

    // Sample users with scaled credit balances (+10 per completed session)
    const sampleUsersData = [
      {
        name: "Sabika Juwairia",
        email: "kazi.sabika.juwairia@g.bracu.ac.bd",
        role: "admin",
        bio: "Senior Peer Mentor in Software Engineering & MERN Stack",
        city: "Dhaka",
        languages: ["English", "Bengali"],
        isVerified: true,
        streakCount: 4,
        creditBalance: 50, // Starter 10 + (4 sessions * 10) = 50 SC
      },
      {
        name: "Sam Muhtasim",
        email: "md.muhtasim.irtija@g.bracu.ac.bd",
        role: "admin",
        bio: "UI/UX & Frontend Design Specialist",
        city: "Dhaka",
        languages: ["English", "Bengali"],
        isVerified: true,
        streakCount: 3,
        creditBalance: 40, // Starter 10 + (3 sessions * 10) = 40 SC
      },
      {
        name: "Faiyaj Masrur",
        email: "faiyaj.masrur@g.bracu.ac.bd",
        role: "admin",
        bio: "Backend Architecture & Node.js Engineer",
        city: "Dhaka",
        languages: ["English", "Bengali"],
        isVerified: true,
        streakCount: 2,
        creditBalance: 30, // Starter 10 + (2 sessions * 10) = 30 SC
      },
      {
        name: "Nusrat Jahan",
        email: "nusrat.jahan@g.bracu.ac.bd",
        role: "admin",
        bio: "Python & Data Analytics Enthusiast",
        city: "Dhaka",
        languages: ["English", "Bengali"],
        isVerified: true,
        streakCount: 1,
        creditBalance: 20, // Starter 10 + (1 session * 10) = 20 SC
      },
      {
        name: "Learner User",
        email: "user@example.com",
        role: "user",
        bio: "Active Learner & Skill Exchange Participant",
        city: "Chittagong",
        languages: ["English"],
        isVerified: false,
        streakCount: 0,
        creditBalance: 10, // Starter 10 SC
      },
    ];

    const usersMap = {};

    for (const uData of sampleUsersData) {
      let user = await User.findOne({ email: uData.email });
      if (!user) {
        user = new User({
          ...uData,
          passwordHash: defaultPassword,
          isVerified: true,
        });
        await user.save();
        console.log(`Created user: ${user.name} (${user.email})`);
      } else {
        user.creditBalance = uData.creditBalance;
        user.isVerified = true;
        user.role = uData.role;
        user.streakCount = uData.streakCount;
        await user.save();
        console.log(`Updated user: ${user.name} (${user.email})`);
      }
      usersMap[user.name] = user;
    }

    const allUsers = await User.find();
    for (const u of allUsers) {
      if (!usersMap[u.name]) {
        usersMap[u.name] = u;
      }
    }

    const sabika = usersMap["Sabika Juwairia"] || allUsers[0];
    const sam = usersMap["Sam Muhtasim"] || allUsers[1] || allUsers[0];
    const faiyaj = usersMap["Faiyaj Masrur"] || allUsers[2] || allUsers[0];
    const nusrat = usersMap["Nusrat Jahan"] || allUsers[3] || allUsers[0];
    const testUser = usersMap["Learner User"] || allUsers[4] || allUsers[0];

    // Seed Sample Skill Listings with valid Mongoose enum values
    const listingsData = [
      {
        teacherId: sabika._id,
        title: "Full Stack MERN Architecture & React Optimization",
        category: "Programming",
        description: "Master React, Express, and MongoDB backend controllers and state management.",
        proficiencyLevel: "intermediate",
        format: "online",
        durationMinutes: 60,
        creditCost: 10,
      },
      {
        teacherId: sam._id,
        title: "UI/UX Design with Tailwind CSS & Glassmorphism",
        category: "Design",
        description: "Learn modern aesthetic web design, responsive cards, and component UI.",
        proficiencyLevel: "beginner",
        format: "online",
        durationMinutes: 60,
        creditCost: 10,
      },
      {
        teacherId: faiyaj._id,
        title: "Node.js REST API & Socket.IO Real-time Engineering",
        category: "Programming",
        description: "Build robust REST APIs, Socket rooms, and real-time WebSocket apps.",
        proficiencyLevel: "expert",
        format: "online",
        durationMinutes: 60,
        creditCost: 10,
      },
      {
        teacherId: nusrat._id,
        title: "Python Data Analysis & Pandas Basics",
        category: "Data Science",
        description: "Introduction to data analysis, dataframes, and visualization in Python.",
        proficiencyLevel: "beginner",
        format: "online",
        durationMinutes: 60,
        creditCost: 10,
      },
    ];

    const listingsMap = {};
    for (const lData of listingsData) {
      let listing = await SkillListing.findOne({ title: lData.title });
      if (!listing) {
        listing = new SkillListing(lData);
        await listing.save();
        console.log(`Created listing: ${listing.title}`);
      }
      listingsMap[lData.title] = listing;
    }

    const sabikaListing = listingsMap["Full Stack MERN Architecture & React Optimization"];
    const samListing = listingsMap["UI/UX Design with Tailwind CSS & Glassmorphism"];
    const faiyajListing = listingsMap["Node.js REST API & Socket.IO Real-time Engineering"];
    const nusratListing = listingsMap["Python Data Analysis & Pandas Basics"];

    // Seed Sample Bookings & Sessions for history & credit tracking
    const sampleBookings = [
      // Completed Sessions (Awarding +10 SC to Teacher)
      {
        listingId: sabikaListing._id,
        studentId: sam._id,
        teacherId: sabika._id,
        preferredDate: "2026-08-05",
        preferredTime: "10:00 AM",
        message: "Looking forward to learning React architecture!",
        status: "completed",
        creditCost: 10,
        heldCredits: 0,
      },
      {
        listingId: sabikaListing._id,
        studentId: faiyaj._id,
        teacherId: sabika._id,
        preferredDate: "2026-08-06",
        preferredTime: "02:00 PM",
        message: "Need guidance on state management.",
        status: "completed",
        creditCost: 10,
        heldCredits: 0,
      },
      {
        listingId: sabikaListing._id,
        studentId: testUser._id,
        teacherId: sabika._id,
        preferredDate: "2026-08-07",
        preferredTime: "04:00 PM",
        message: "MERN Stack session review.",
        status: "completed",
        creditCost: 10,
        heldCredits: 0,
      },
      {
        listingId: samListing._id,
        studentId: sabika._id,
        teacherId: sam._id,
        preferredDate: "2026-08-04",
        preferredTime: "11:00 AM",
        message: "Let's review UI design principles.",
        status: "completed",
        creditCost: 10,
        heldCredits: 0,
      },
      {
        listingId: samListing._id,
        studentId: nusrat._id,
        teacherId: sam._id,
        preferredDate: "2026-08-08",
        preferredTime: "01:00 PM",
        message: "Tailwind CSS grid layout session.",
        status: "completed",
        creditCost: 10,
        heldCredits: 0,
      },
      {
        listingId: faiyajListing._id,
        studentId: sabika._id,
        teacherId: faiyaj._id,
        preferredDate: "2026-08-03",
        preferredTime: "03:00 PM",
        message: "Socket.IO event handling discussion.",
        status: "completed",
        creditCost: 10,
        heldCredits: 0,
      },
      {
        listingId: nusratListing._id,
        studentId: faiyaj._id,
        teacherId: nusrat._id,
        preferredDate: "2026-08-02",
        preferredTime: "05:00 PM",
        message: "Python basics tutorial session.",
        status: "completed",
        creditCost: 10,
        heldCredits: 0,
      },
      // Confirmed / Accepted Session
      {
        listingId: sabikaListing._id,
        studentId: nusrat._id,
        teacherId: sabika._id,
        preferredDate: "2026-08-12",
        preferredTime: "10:30 AM",
        message: "Confirmed session for MERN architecture.",
        status: "accepted",
        creditCost: 10,
        heldCredits: 10,
      },
      // Pending Session
      {
        listingId: faiyajListing._id,
        studentId: testUser._id,
        teacherId: faiyaj._id,
        preferredDate: "2026-08-14",
        preferredTime: "02:30 PM",
        message: "Would like to learn Socket.IO integration.",
        status: "pending",
        creditCost: 10,
        heldCredits: 10,
      },
      // Cancelled Session
      {
        listingId: samListing._id,
        studentId: testUser._id,
        teacherId: sam._id,
        preferredDate: "2026-08-01",
        preferredTime: "09:00 AM",
        message: "Cancelled session due to schedule conflict.",
        status: "cancelled",
        creditCost: 10,
        heldCredits: 0,
      },
    ];

    for (const bData of sampleBookings) {
      const existing = await Booking.findOne({
        teacherId: bData.teacherId,
        studentId: bData.studentId,
        preferredDate: bData.preferredDate,
      });

      let booking;
      if (!existing) {
        booking = new Booking(bData);
        await booking.save();
        console.log(`Created booking: ${bData.preferredDate} (${bData.status})`);
      } else {
        booking = existing;
      }

      // Sync Session history collection
      if (bData.status === "completed") {
        await Session.findOneAndUpdate(
          { teacherId: bData.teacherId, learnerId: bData.studentId, sessionDate: new Date(bData.preferredDate) },
          {
            teacherId: bData.teacherId,
            learnerId: bData.studentId,
            skill: bData.listingId ? (await SkillListing.findById(bData.listingId))?.title || "Skill Session" : "Skill Session",
            sessionDate: new Date(bData.preferredDate),
            status: "Completed",
          },
          { upsert: true, new: true }
        );

        // Record Credit Transactions
        await CreditTransaction.create({
          userId: bData.teacherId,
          type: "earn",
          amount: 10,
          sessionId: booking._id,
          description: `Session completed — +10 SC earned teaching session on ${bData.preferredDate}`,
        });

        await CreditTransaction.create({
          userId: bData.studentId,
          type: "spend",
          amount: 10,
          sessionId: booking._id,
          description: `Session completed — 10 SC paid for learning session`,
        });

        // Record Notifications
        await Notification.create({
          userId: bData.teacherId,
          title: "Session Completed",
          message: `Session completed successfully! You earned +10 SC.`,
          type: "credit",
          isRead: false,
        });

        await Notification.create({
          userId: bData.studentId,
          title: "Session Completed",
          message: `Session marked completed. 10 SC transferred to your teacher.`,
          type: "booking",
          isRead: false,
        });
      } else if (bData.status === "accepted") {
        await Notification.create({
          userId: bData.studentId,
          title: "Booking Accepted",
          message: `Your booking request for ${bData.preferredDate} was accepted!`,
          type: "booking",
          isRead: false,
        });
      } else if (bData.status === "pending") {
        await Notification.create({
          userId: bData.teacherId,
          title: "New Booking Request",
          message: `New booking request received for ${bData.preferredDate} at ${bData.preferredTime}.`,
          type: "booking",
          isRead: false,
        });
      }
    }

    // Ensure all users have initial starter credit transactions & welcome notification
    for (const uObj of Object.values(usersMap)) {
      const starterTx = await CreditTransaction.findOne({ userId: uObj._id, type: "starter" });
      if (!starterTx) {
        await CreditTransaction.create({
          userId: uObj._id,
          type: "starter",
          amount: 10,
          description: "Welcome bonus — starter credits awarded on registration",
        });
      }

      const welcomeNotif = await Notification.findOne({ userId: uObj._id, title: "Welcome to Dokkhota!" });
      if (!welcomeNotif) {
        await Notification.create({
          userId: uObj._id,
          title: "Welcome to Dokkhota!",
          message: "You have received 10 starter credits! Start exploring skills or book your first session.",
          type: "credit",
          isRead: false,
        });
      }
    }

    // Seed Sample Reviews for Top Ratings
    const sampleReviews = [
      {
        bookingId: sampleBookings[0]._id || new mongoose.Types.ObjectId(),
        listingId: sabikaListing._id,
        reviewerId: sam._id,
        revieweeId: sabika._id,
        rating: 5,
        comment: "Excellent MERN stack session! Sabika explained architecture and controllers very clearly.",
      },
      {
        bookingId: sampleBookings[1]._id || new mongoose.Types.ObjectId(),
        listingId: sabikaListing._id,
        reviewerId: faiyaj._id,
        revieweeId: sabika._id,
        rating: 5,
        comment: "Great hands-on session on React hooks and state management.",
      },
      {
        bookingId: sampleBookings[3]._id || new mongoose.Types.ObjectId(),
        listingId: samListing._id,
        reviewerId: sabika._id,
        revieweeId: sam._id,
        rating: 5,
        comment: "Awesome UI design session! Very practical Tailwind CSS tips.",
      },
      {
        bookingId: sampleBookings[5]._id || new mongoose.Types.ObjectId(),
        listingId: faiyajListing._id,
        reviewerId: sabika._id,
        revieweeId: faiyaj._id,
        rating: 5,
        comment: "Very informative Node.js API and Socket.IO real-time engineering session.",
      },
    ];

    for (const rData of sampleReviews) {
      const existing = await Review.findOne({ reviewerId: rData.reviewerId, revieweeId: rData.revieweeId });
      if (!existing) {
        try {
          await Review.create(rData);
          console.log(`Created review for user ${rData.revieweeId}`);
        } catch (e) {
          // ignore duplicate review constraint
        }
      }
    }

    console.log("\n🎉 Database Seeded Successfully!");
    console.log("-----------------------------------------");
    console.log("✅ Users seeded with scaled credits (+10 SC per session):");
    console.log("   - Sabika Juwairia: 50 SC (4 completed sessions)");
    console.log("   - Sam Muhtasim: 40 SC (3 completed sessions)");
    console.log("   - Faiyaj Masrur: 30 SC (2 completed sessions)");
    console.log("   - Nusrat Jahan: 20 SC (1 completed session)");
    console.log("   - Learner User: 10 SC (Starter credits)");
    console.log("✅ Session History Logs seeded for Teachers & Learners");
    console.log("✅ Credit Transactions & Notifications seeded for all users");
    console.log("-----------------------------------------");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runSeed();