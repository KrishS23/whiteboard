const mongooseDatabase = require("mongoose");

const canvasDataSchema = new mongooseDatabase.Schema({
    owner: { 
        type: mongooseDatabase.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    shared: [{ 
        type: mongooseDatabase.Schema.Types.ObjectId, 
        ref: "User" 
    }],
    elements: [{ 
        type: mongooseDatabase.Schema.Types.Mixed 
    }],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongooseDatabase.model("Canvas", canvasDataSchema);