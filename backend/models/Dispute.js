const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
{
    reporter:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    reportedUser:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    reason:{
        type:String,
        required:true
    },

    status:{
        type:String,
        enum:["Pending","Resolved"],
        default:"Pending"
    }

},
{timestamps:true}
);

module.exports=mongoose.model("Dispute",disputeSchema);