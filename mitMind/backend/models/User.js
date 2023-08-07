const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); 
const crypto = require("crypto");


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter a name"],
    },

    avatar: {
        public_id: String,
        url: String,
    },

    email: {
        type: String,
        required: [true, "please enter an email"],
        unique: [true, "Email alrady exists"],
    },
    password: {
        type: String,
        required :[true, "Please enter a password"],
        minlength: [6, "Password must be at least 6 characters"],
        select: false,
    },

    post: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],


    resetPasswordToken: String,
    resetPasswordExpires: Date,

    

});


//this function run before the schema validation
userSchema.pre("save", async function (next) {
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});


// it is (next two schema )commented by me earlyear but then while making getresetPassword i recomment it 
userSchema.method.matchPassword = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.method.generateToken = async function(){
    return jwt.sign({
        _id: this._id
    }, process.env.JWT_SECRET);
};

// userSchema.method.getResetPasswordToken = function(){
//     const resetToken = crypto.randomBytes(20).toString("hex");
//     this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
//     this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
//     return resetToken;
// };

userSchema.statics.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    // return {
    //   resetToken,
    //   hashedToken,
    //   resetPasswordExpires
    // };

    return resetToken;
  };


module.exports = mongoose.model("User", userSchema);