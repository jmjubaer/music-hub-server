const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



app.get('/',async(req, res)=> {
    res.send('Summer Camp server Running ........')
})
app.listen(port,() => {
    console.log("Summer Camp server running on port", port);
});