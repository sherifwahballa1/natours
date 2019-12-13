const mongoose = require('mongoose');
const dotenv = require('dotenv'); //for config files

dotenv.config({
  path: './config.env'
});

//if you connect to host Database
const DB_Host = process.env.DATABASE_HOST.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose
  //host DB
  //.connect(DB_Host);
  //local DB
  .connect(process.env.DATATBASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('Successfully connected');
  });

const app = require('./index');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Running on port ${port}..`);
});

//to debug  [npm i ndb --global]
//to run debug [npm run debug]
