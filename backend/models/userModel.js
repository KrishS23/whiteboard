const mongooseDatabase = require("mongoose");
const passwordEncryption = require("bcrypt");

const userDataSchema = new mongooseDatabase.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
});

userDataSchema.pre("save", async function (nextStep) {
    if (!this.isModified("password")) return nextStep();
    
    try {
        const encryptionSalt = await passwordEncryption.genSalt(10);
        this.password = await passwordEncryption.hash(this.password, encryptionSalt);
        nextStep();
    } catch (encryptionError) {
        nextStep(encryptionError);
    }
});

userDataSchema.methods.verifyUserPassword = async function (userEnteredPassword) {
    return passwordEncryption.compare(userEnteredPassword, this.password);
};

module.exports = mongooseDatabase.model("User", userDataSchema);