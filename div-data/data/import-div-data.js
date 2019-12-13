// add data to from json file to database
//run sperate in command
//node div-data/data/import-div-data.js --import //--delete
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); //for config files
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

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

// Read Json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//Import Data into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data Successfully Loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//Delete All Data from DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data Successfully Deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
