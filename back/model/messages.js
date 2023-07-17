const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { Boolean, Mixed } = Schema.Types;

const messageSchema = new Schema({
    nameChat: String,
    content: String,
    day: Number,
    mounth: Number,                    
    minutes: Number,                  
    hour: Number,                 
    sent: Boolean,
    cron: Mixed
});

module.exports = mongoose.model('messages', messageSchema);