const mongoose = require("mongoose");

const ChatUser = new mongoose.Schema(
    {   
        username:{
            type:String,
            required: true,
        },
        name: {
            type: String,
            require : true
        },
        password:{
            type:String,
            required: true
        },
        avatar:{
            type: String,
            required :true,
        },
        createTime: { type: Date, default: Date.now },
    }
)
//name of table, schema
module.exports = mongoose.model("ChatUser", ChatUser)