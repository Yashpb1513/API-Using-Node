const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require("dotenv").config();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/api/v3/app', require('./routes/eventRouter'));
// app.use('/', require('./routes/indexRouter'));

app.get('/', (req, res) => {
    res.send('Welcome to the API');
}
);  

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
}
);