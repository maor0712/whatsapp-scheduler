const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017', { useNewUrlParser: true, dbName: 'whatsapp' })
.then(() => console.log('Connected!'));