const mongoose = require("mongoose");
const user = new mongoose.Schema(
    {
        name: {
            type: String,
            require: true
        },
        avatar: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            require: true
        },
    }
)
const Message = new mongoose.Schema(
    {
        user: {
            type: user,
            require : true
        },
        content:{
            type:String,
            required: true
        },
        datetime: { type: Date, default: Date.now },
    }
)
//name of table, schema
module.exports = mongoose.model("Message", Message)