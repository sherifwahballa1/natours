//const fs = require("fs");
const Tour = require('./../models/tourModel');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../div-data/data/tours-simple.json`)
// );

//middleware check the id
// exports.checkID = (req, res, next) => {
//   console.log(`Tour id is : ${req.params.id}`);
// const tour = tours.find(el => el.id == req.params.id);
// if (!tour) {
//   return res.status(404).json({
//     status: "fail",
//     message: "No tour Exists"
//   });
// }
//   next();
// };
//middleware check the body
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'name and price must be exists',
//     });
//   }
//   next();
// };

//middleware get top 5 tours
exports.alisTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    //localhost:3000/api/v1/tours?duration=5&difficulty=easy
    //req.query = duration=5&difficulty=easy

    //1 Bulid query
    const queryObj = { ...req.query };
    //delete these kewords from queryObj (injection)
    const excludeFields = ['page', 'sort', 'limit', 'fields', 'delete'];
    excludeFields.forEach(el => delete queryObj[el]);
    //console.log(req.query, queryObj);

    let queryStr = JSON.stringify(queryObj);
    //example replace gte to $gte
    //localhost:3000/api/v1/tours?duration[gte]=5&difficulty=easy
    queryStr = queryStr.replace(
      /\b(gte|lte|lt|gt|equel)\b/g,
      match => `$${match}`
    );
    const queryData = JSON.parse(queryStr);

    let query = Tour.find(queryData);

    //Sorting
    //localhost:3000/api/v1/tours?sort=price,ratingsAverage
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt'); //sort by createdAt automatically
    }

    //select limitted fields
    //localhost:3000/api/v1/tours?fields=name,duration,price,difficulty
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    //pagination
    //localhost:3000/api/v1/tours?page2&limit=10
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numberOfTours = await Tour.countDocuments();
      if (skip >= numberOfTours) throw new Error('This page does not exists'); //go to catch
    }
    //2) Execute query
    const tours = await query;
    //3) send response
    res.status(200).json({
      status: 'Success',
      requestTime: req.requestTime,
      results: tours.length,
      data: {
        tours: tours
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message
    });
  }
};
exports.createTour = async (req, res) => {
  try {
    // const newTour = new Tour({});
    // newTour.save();

    //create function add data from req in the collection as collection implement and
    //not add any new columns like save beacuse it deal with collection direct
    const newTour = await Tour.create(req.body); //return promise like save
    res.status(201).json({
      status: 'Success',
      data: {
        tour: newTour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message
    });
  }
};
exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'Success',
      results: '1',
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      err: 'cannot find tour with this id',
      message: err.message
    });
  }
};
exports.updateTour = async (req, res) => {
  //(patch) method update only differnets in the body and database so this is best
  //(put) method update the all the document in the database with the data in body
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true //update validators validate update operations against the model
    });
    res.status(200).json({
      status: 'success',
      message: 'tour Updated',
      date: {
        tour
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'Success Deleted',
      data: null
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err
    });
  }
};
