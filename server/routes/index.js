var express = require('express');
const cors = require('cors');
require('dotenv').config();
let router = express.Router();

router.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});
router.use(express.json());

router.get('/', (req, res)=> {
  res.status(202).json(
    {
      VERSION: 1.0,
      NAME: 'EpicStudia'
    }
  )  
})

module.exports = router;