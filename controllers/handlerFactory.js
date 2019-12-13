const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

//all these function used in all controllers (user, review, tour)

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      const err = new Error('No Document found with that ID');
      err.statusCode = 404;
      err.status = 'fail';
      next(err);
    }
    res.status(204).json({
      status: 'Success Deleted',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true //update validators validate update operations against the model
    });

    if (!doc) {
      const err = new Error('No Document found with that ID');
      err.statusCode = 404;
      err.status = 'fail';
      next(err);
    }

    res.status(200).json({
      status: 'success',
      message: 'tour Updated',
      date: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body); //return promise like save
    res.status(201).json({
      status: 'Success',
      data: {
        date: newDoc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    //populate to get all the data which refered
    //const tour = await Tour.findById(req.params.id).populate('guides');
    //or can unselect specific columns
    //in ch11 v11 we use populate here with virtual method to refer to reviews in Review model
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    res.status(200).json({
      status: 'Success',
      results: '1',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //To allow for nested Get reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //2) Execute query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    //3) send response
    res.status(200).json({
      status: 'Success',
      requestTime: req.requestTime,
      results: docs.length,
      data: {
        data: docs
      }
    });
  });
