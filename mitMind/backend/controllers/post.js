const Post = require('../models/Post');
const User = require('../models/User');

exports.createPost =async (req, res) => {
    try {
        const newPostData = {
            caption : req.body.caption,
            image:{
                public_id:"req.body.public_id",
                url:"req.body.url",
            },
            owner:req.user._id,
        };
        
        const post = await Post.create(newPostData);

        const user = await User.findById(req.user._id);
        
        user.post.push(post._id);

        await user.save();



        res.status(201).json({
            success:true,
            post,
        });
    } catch (error) {
        res.status(400).json({
            success:false,
            message:error.message,
        });
    }
}

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({
                success:false,
                message:"Post not found"
            });
        }
        if(post.owner.toString()!== req.user._id.toString()) {    // here i think Post And User 
            return res.status(401).json({
                success:false,
                message:"You are not the owner of this post"
            });
        }

        // code by 6pp

        // await post.remove();

        // const user = await User.findById(req.user._id);
        // const index = user.posts.index(req.params.id);
        // user.posts.splice(index, 1);
        // await user.save();




        // res.status(200).json({
        // success:true,
        // message:"Post deleted"
        // });

        try {
            const deletedPost = await Post.deleteOne({ _id: req.params.id });
            if (deletedPost.deletedCount === 0) {
              return res.status(404).send('Post not found');
            }
            res.send(deletedPost);
          } catch (err) {
            console.error(err);
            res.status(500).send('Server error');
          }
        

}
    catch (error) {
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }

exports.likeAndUnlikePost = async (req, res) =>{
    try {
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({
                success:false,
                message:"Post not found"
            });
        }
        if(post.likes.includes(req.user._id)){
            const index = post.likes.indexOf(req.user._id);
            post.likes.splice(index,1);
            
            await post.save();

            return res.status(200).json({
                success:true,
                message:"Unliked"
            });
        }
        else{
            post.likes.push(req.user._id);

            await post.save();
            
            return res.status(200).json({
                success:true,
                message:"Liked"
            });

        }
        
    }catch (error) {
        res.status(400).json({
            success:false,
            message:error.message,
        });
    }
}};

exports.getPostofFollowing =async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const posts = await Post.find({
            owner:{
                $in: user.following,
            }, 
        });

        res.status(200).json({
            success: true,
            posts,
        });

        
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}

exports.updateCaption = async (req, res) => {
    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success:false,
                message:"Post not found"
            });
        }

        if (post.owner.toString() != req.user._id.toString()) {
            return res.status(401).json({
                success:false,
                message:"You are not the owner of this post"
            });
        }

        post.caption=req.body.caption;
        await post.save();
        res.status(200).json({
            success:true,
            message:"Caption updated"
        });
        
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}

exports.commentOnPost= async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({
                success:false,
                message:"Post not found"
            });
        }

        let commentExists = -1;
        

        post.comments.forEach((item, index) => {
            if(item.user.toString() === req.user._id.toString()){
                commentExists = index;
                
            }
        });

        if(commentExists !== -1){


            post.comments[commentExists].comment = req.body.comment;

            await post.save();

            return res.status(200).json({
                success:true,
                message:"Comment updated",
            });
        
        }else{


            post.comments.push({
                user : req.user._id,
                comment : req.body.comment,
            });

            await post.save();

            return res.status(200).json({
                success:true,
                message:"Comment added",
            });
        }
        




        
    } catch (error) {
       res.status(500).json({
        success:false,
        message:error.message,
       }); 
    }
};


exports.deleteComment = async (req, res) =>{
    try {
        
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post not found"
            });
        }

        // chaking the owner wants to delete the comment
        if(post.owner.toString()===req.user._id.toString()){

            if(req.body.commentId == undefined){
                return res.status(400).json({
                    success:false,
                    message:"Comment Id is required"
                });
            }

            post.comments.forEach((item ,index)=>{
                if(item._id.toString()===req.body.commentId.toString()) {
                    
                    return post.comments.splice(index, 1);

                }
            });

            await post.save();
            return res.status(200).json({
                success:true,
                message:"selected Comment has deleted"
            })

        }else{
            

            post.comments.forEach((item ,index)=>{
                if(item.user.toString()===req.user._id.toString()) {
                    
                    return post.comments.splice(index, 1);

                }
            });


            await post.save();

            return res.status(200).json({
                success:true,
                message:"Your Comment has deleted"
            })
        }
    } catch (error) {
        res.status(500).json({
            success :false,
            message:error.message,
        });
    }
};

