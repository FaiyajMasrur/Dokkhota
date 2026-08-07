const User = require("../models/User");
const Booking = require("../models/Booking");
const Dispute = require("../models/Dispute");
const CreditTransaction = require("../models/CreditTransaction");


exports.getDashboard = async (req, res) => {
  try {

    const totalUsers = await User.countDocuments();

    const totalBookings = await Booking.countDocuments();

    const totalDisputes = await Dispute.countDocuments();

    const totalCredits = await CreditTransaction.aggregate([
      {
        $group: {
          _id: null,
          credits: { $sum: "$amount" }
        }
      }
    ]);

    res.json({
      success: true,
      totalUsers,
      totalBookings,
      totalDisputes,
      totalCredits: totalCredits[0]?.credits || 0
    });

  } catch (err) {

    res.status(500).json({
      success:false,
      message:err.message
    });

  }
};

exports.getUsers = async (req,res)=>{

try{

const users=await User.find().select("-passwordHash");

res.json({
success:true,
users
});

}

catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

//////////////////UNSUSPEND/////////////////
exports.suspendUser=async(req,res)=>{

try{

await User.findByIdAndUpdate(req.params.id,{
isSuspended:true
});

res.json({
success:true,
message:"User Suspended"
});

}

catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// //////////UNSUSPEND//////////////////
exports.unsuspendUser=async(req,res)=>{

try{

await User.findByIdAndUpdate(req.params.id,{
isSuspended:false
});

res.json({
success:true,
message:"User Activated"
});

}

catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// //////////////DELETE/////////////////
exports.deleteUser=async(req,res)=>{

try{

await User.findByIdAndDelete(req.params.id);

res.json({
success:true,
message:"User Deleted"
});

}

catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

// ///////////////////VIEW////////////////////
exports.getDisputes=async(req,res)=>{

try{

const disputes=await Dispute.find()
.populate("reporter","name email")
.populate("reportedUser","name email");

res.json({
success:true,
disputes
});

}

catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};

/////////RESOLVE////////////////////////
exports.resolveDispute=async(req,res)=>{

try{

await Dispute.findByIdAndUpdate(req.params.id,{
status:"Resolved"
});

res.json({
success:true,
message:"Resolved"
});

}

catch(err){

res.status(500).json({
success:false,
message:err.message
});

}

};