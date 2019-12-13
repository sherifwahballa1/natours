const mongoose = require('mongoose');
const validator = require('validator');
const User = require('./userModel');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tour Must have a Name'],
      minlength: [5, 'tour name must have more than 5 characters'],
      maxlength: [40, 'maxiam length of the tour name 40 characters'],
      unique: true,
      trim: true
      //validate: [validator.isAlpha, 'tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A Tour Must have duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour Must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be less than 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Tour Must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        //custom validation
        validator: function(val) {
          return val < this.price;
        },
        message: 'Discout price value should be less than price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],

    //ch11
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    //embadded or de-normalize dataset(document) into tour(document) dataset (ch11)
    //all locations of the tour locations it can be a document but we embadded it into tour document
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    //video 5 ch11 for embadding
    //guides: Array

    //video 6 ch11 for reference
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  //virtual properties
  //to make sure the field that not stored in database but calculated by some other value stored
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

//index improve search
//tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ startLocation: '2dsphere' });

//virtual properties
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //refer to field tour in Review model
  localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// way for implement embadding(put all data of users(user) who share in tour in tour datase) users in tour (ch11) video 5
//this for creating new document not update so it's not prefered need to sure if data updated each time
/*tourSchema.pre('save', async function(next) {
  const guidesPromises = this.guides.map(async id => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);
  next();
});*/

//ch11 v7
tourSchema.pre(/^find/, function(next) {
  //this refer to query that start with find
  this.populate({
    path: 'guides',
    select: '-__v -passwordResetExprires -passwordChangedAt -passwordResetToken'
  });
  next();
});
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
