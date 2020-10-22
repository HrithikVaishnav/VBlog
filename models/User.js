const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    Username: {
        type: String,
        required: true,
    },
    Password: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    }
}, { timestamps : true});

const User = mongoose.model('User' , UserSchema);

module.exports = User;