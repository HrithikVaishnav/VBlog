const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const blogSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    Keywords: {
        type: String,
        required: true
    },
    Content: {
        type: String,
        required: true
    },
    Username: {
        type: String,
        required:true
    }
}, { timestamps : true});

const Blog = mongoose.model('Blogs' , blogSchema);

module.exports = Blog;