const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

const multerStroage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    const err = new Error('Not an image! please upload only images.');
    err.statusCode = 400;
    err.status = 'fail';
    cb(err, false);
  }
};

const upload = multer({
  storage: multerStroage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //1)Cover Image
  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({
      quality: 90
    })
    .toFile(`public/img/tours/${imageCoverFilename}`);

  req.body.imageCover = imageCoverFilename;

  //2)Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({
          quality: 90
        })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});
//middleware get top 5 tours
exports.alisTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};
exports.getAllTours = factory.getAll(Tour);

// exports.getTour = catchAsync(async (req, res, next) => {
//   //populate to get all the data which refered
//   //const tour = await Tour.findById(req.params.id).populate('guides');
//   //or can unselect specific columns

//   //in ch11 v11 we use populate here with virtual method to refer to reviews in Review model
//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   res.status(200).json({
//     status: 'Success',
//     results: '1',
//     data: {
//       tour,
//       durationWeeks: tour.durationWeeks //use virtual method here
//     }
//   });
// });
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = async (req, res) => {
//   try {
//     await Tour.findByIdAndDelete(req.params.id);
//     res.status(204).json({
//       status: 'Success Deleted',
//       data: null
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'failed',
//       message: err
//     });
//   }
// };
exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: {
          ratingsAverage: {
            $gte: 4.5
          },
          difficulty: {
            $ne: 'easy'
          }
        } //match this quary and do aggragate group
      },
      {
        $group: {
          _id: '$difficulty', //group by difficulty
          //_id: '$ratingsAverage', //group by ratingsAverage
          numTours: {
            $sum: 1
          }, //count of each _id value
          numRatings: {
            $sum: '$ratingsQuantity'
          },
          avgRating: {
            $avg: '$ratingsAverage'
          },
          avgPrice: {
            $avg: '$price'
          },
          minPrice: {
            $min: '$price'
          },
          maxPrice: {
            $max: '$price'
          }
        }
      },
      {
        $sort: {
          avgPrice: -1
        }
      }
    ]);
    res.status(200).json({
      status: 'Success',
      data: {
        stats
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err
    });
  }
};
//pipeline
exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates' //diplay each element in array in tour model
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: {
            $month: '$startDates'
          }, //group by month $month function in Date
          numTourStarts: {
            $sum: 1
          }, //number of tours in each month
          tours: {
            $push: '$name'
          }
        }
      },
      {
        $addFields: {
          month: '$_id'
        }
      },
      {
        $project: {
          _id: 0
        } //delete _id from results
      },
      {
        $sort: {
          numTourStarts: -1
        }
      },
      {
        $limit: 5
      }
    ]);
    res.status(200).json({
      status: 'Success',
      results: plan.length,
      data: {
        plan
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err
    });
  }
};

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    const err = new Error(
      'Please provide latitutr and longitude in the format lat,lng.'
    );
    err.statusCode = 400;
    err.status = 'fail';
    next();
  }
  //console.log(lat,lng,radius);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    const err = new Error(
      'Please provide latitutr and longitude in the format lat,lng.'
    );
    err.statusCode = 400;
    err.status = 'fail';
    next();
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
