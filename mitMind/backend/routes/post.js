const express = require('express');
const { createPost, deletePost, getPostofFollowing, likeAndUnlikePost, updateCaption, commentOnPost, deleteComment} = require('../controllers/post');
const { isAuthenticated } = require('../middlewares/auth');
const Post = require('../models/Post');

const router = express.Router();

router.route('/post/upload').post(isAuthenticated, createPost);

router.route('/post/:id').get(isAuthenticated, async (req, res) =>{   // this is like and unlike api
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
});

router.route('/post/:id').delete(isAuthenticated, deletePost);

router.route('/posts').get(isAuthenticated, getPostofFollowing);

router.route('/post/:id').put(isAuthenticated, updateCaption);

router.route('/post/comment/:id')
        .put(isAuthenticated, commentOnPost)
        .delete(isAuthenticated, deleteComment);





 

module.exports = router;