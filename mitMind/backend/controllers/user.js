const User = require('../models/User');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Post = require('../models/Post');
const {sendEmail} = require('../middlewares/sendEmail');
 

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        let user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists',
            });
        }

        user = await User.create({ name, email, password, avatar: { public_id:"sample_id", url: "sampleurl" }, });

        const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

        

        res.status(201)
        .cookie("token", token,{
            expires:new Date(Date.now()+90*24*60*60*1000),
            httpOnly:true,
        }).json({
            success: true,
            user,
            token,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
};

exports.login = async (req, res) => {

    try {

        const {email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");

        if(!user) {
            return res.status(400).json({
                success: false,
                message: 'User not exits',
            });
        }
        // const isMatch = await user.matchPassword(password);

        // const isMatch = await async function(password){
        //     return await bcrypt.compare(password, this.password);
        // }

        // const isMatch = function(password) {
        //     return bcrypt.compare(password, user.password);
        // }

        // const isMatch = bcrypt.compare(password, user.password);
        const isMatch = bcrypt.compareSync(password, user.password);

        if(!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Password is incorrect',
            });
        }

        // const token = await user.generateToken();

        // const token = async function(){
        //     return jwt.sign({
        //         _id: this._id
        //     }, process.env.JWT_SECRET);
        // };

        // const token = async function () {
        //     return jwt.sign({
        //         _id: user._id
        //     }, process.env.JWT_SECRET);
        // };

        const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

        

        res.status(200)
        .cookie("token", token,{
            expires:new Date(Date.now()+90*24*60*60*1000),
            httpOnly:true,
        }).json({
            success: true,
            user,
            token,
        });
    }catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

};

exports.logout = async (req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({
            success: true,
            message: 'Logged out',
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


exports.followUser = async (req, res) => {
    try {
        
        const userToFollow = await User.findById(req.params.id);
        const LoggedInUser = await User.findById(req.user._id);

        if (!userToFollow) {
            return res.status(400).json({
                success: false,
                message: 'User not found',
            });
        }

        // it is method only stop to follow user when we trigger with same id 

        // if(LoggedInUser.following.includes(userToFollow._id)) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'You are already following this user',
        //     });
        // } 

        // now this method if we try to follow same user twice then he automaticall unfollow it 

        if(LoggedInUser.following.includes(userToFollow._id)){

            const indexfollowing = LoggedInUser.following.indexOf(userToFollow._id);
            LoggedInUser.following.splice(indexfollowing, 1);

            const indexfollowers= userToFollow.followers.indexOf(userToFollow._id);
            userToFollow.followers.splice(indexfollowers, 1);

            await LoggedInUser.save();
            await userToFollow.save(); 

            res.status(200).json({
                success: true,
                message: 'User UnFollowed',
            });
        }
        else{
            LoggedInUser.following.push(userToFollow._id);
            userToFollow.followers.push(LoggedInUser._id);

        await LoggedInUser.save();
        await userToFollow.save();

        res.status(200).json({
            success: true,
            message: 'User Followed',
        });
        }

        

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

exports.updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");

        const { oldPassword, newPassword } = req.body;

        if(!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password is required',
            });
        }

        // const isMatch = await User.matchPassword(oldPassword);
        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if(!isMatch){
            return res.status(400).json({
                success: false,
                message: 'Password is incorrect',
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password Updated',
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


exports.updateProfile = async (req, res) =>{
    try {
        const user = await User.findById(req.user._id);

        const {name, email} = req.body;

        if(name){
            user.name = name;
        }
        if(email){
            user.email = email;
        }

        // User Avatar todo 

        await user.save();

            res.status(200).json({
            success: true,
            message: 'Profile Updated',
        });
    } catch (error) {
        res.status(500).json({
            success : false,
            message : error.message,
        })
    }
}

exports.deleteMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const posts = user.post;
        const followers = user.followers;
        const following = user.following;
        const userId = user._id;

        

        await User.deleteOne({ _id: user});
        if (user.deletedCount === 0) {
        return res.status(404).json({ message: 'User not found' });
        }
    

        res.clearCookie("token");
    
        // deleteing all posts from the database
        for (let i = 0; i < posts.length ; i++) {
            const post = await Post.findById(posts[i]);
            // await post.remove();

            await Post.deleteOne({ _id: post });
        }

        // removing user from followers and following 

            for (let i = 0; i < followers.length ; i++) {
            const follower = await User.findById(followers[i]);

            const index = follower.following.indexOf(userId);
            follower.following.splice(index, 1);
            await follower.save();
            }

            for (let i = 0; i < following.length; i++) {
                const follows = await User.findById(following[i]);

                const index = follows.followers.indexOf(userId);
                follows.followers.splice(index, 1);
                await follows.save();
            }


        res.status(200).json({

            success: true,
            message: 'Profile Deleted',
        });
        
    } catch (error) {
        res.status(500).json({
            success : false,
            message : error.message,
        })
    }
};


exports.myProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("post");
        res.status(200).json({
            success: true,
            user,
        });

    } catch (error) {
        res.status(500).json({
            success : false,
            message : error.message,
        });
    }
};


exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate("post");

        if(!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found',
            });
        }


        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        res.status(500).json({
            success : false,
            message : error.message,
        });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        res.status(500).json({
            success : false,
            message : error.message,
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
       
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found',
            });
        }

        const resetPasswordToken = User.getResetPasswordToken();
        console.log(resetPasswordToken);
        await user.save();

        // getResetPasswordToken
        const resetPasswordUrl = `${req.protocol}://${req.get(
            "host"
        )}/api/v1/password/reset/${resetPasswordToken}`;

        const message = `reset Your password by clicking on link below : \n\n ${resetPasswordUrl}`;
        
        try {
            
            await sendEmail({
                email: user.email,
                subject: "Password Reset",
                message,
            });

            res.status(200).json({
                success: true,
                message: 'Email sent to $(user.email) successfully',
            });
        } catch (error) {
            User.resetPasswordToken= undefined;
            User.resetPasswordExpire = undefined;
            await user.save();

            res.status(500).json({
                success: false,
                message: error.message,
            });

        }
 
        
    } catch (error) {
      
        res.status(500).json({
            success : false,
            message : error.message,
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const resetPasswordToken= req.params.token;
        const {newPassword } = req.body;

        // Find the user in the database using the resetPasswordToken
        const user = await User.findOne({ resetPasswordToken });
    
        // If no user is found, return an error response
        if (!user) {
          return res.status(400).json({ message: 'Invalid reset password token' });
        }
    
        // Check if the resetPasswordToken has expired
        if (Date.now() > user.resetPasswordExpires) {
          return res.status(400).json({ message: 'Reset password token has expired' });
        }
    
        // Generate a new password and hash it using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
        // Update the user's password and save to the database
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
    
        // Return a success response
        return res.status(200).json({ message: 'Password reset successfully' });
       
    } catch (error) {
        res.status(500).json({
            success : false,
            message : error.message,
        });
    }
};