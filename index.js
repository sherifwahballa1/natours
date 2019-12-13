const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize'); //for nosql injection
const xxs = require('xss-clean'); //for injection
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const rateLimit = require('express-rate-limit'); // to prevent many of requests from the same ip and prevent from attakers
const globalError = require('./controllers/errorController');
const tourRouter = require('./routes/tourRouter');
const userRoter = require('./routes/userRouter');
const viewRoter = require('./routes/viewRouter');
const reviewRouter = require('./routes/reviewRouter');
const bookingRouter = require('./routes/bookingRouter');
const AppError = require('./utils/appError');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
//1) Middlewares

//a middleware that's gonna allow us to see request data right in the console.
//third-party middleware

//Global Middlewares

//Serving static files
app.use(express.static(`${__dirname}/public`));

//set Security HTTP headers
app.use(helmet());

//Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//100 request from the same ip in 1 hour
//Limit request from same API
//limiter middleware function
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //try after one hour
  message: 'Too many requests from this IP, please try again in an hour'
});

app.use('/api', limiter); // limit on any url start with /api

//body parser , read data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization against NoSQL Query injection
app.use(mongoSanitize()); // prevent from NoSQL injection like (email:{"$gt":""}) in body

// Data sanitization aganist cross-site scripting (XSS)
app.use(xxs()); //prevent if code contain html code or js code in body and convert it to symboles known

//prevent parameter pollution like (localhost:3000/api/v1/tours?sort=duration&sort=price)
//2 sort queries
app.use(
  hpp({
    //this whitelist of all keywords that possible used more than one time in query
    //like (localhost:3000/api/v1/tours?maxGroupSize=5&maxGroupSize=10)
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'price',
      'difficulty'
    ]
  })
);

//test Middleware
//create my simple middleware
app.use((req, res, next) => {
  console.log('Hello From the Middleware 😁');
  next();
});

//second my middleware add property to req object
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});
//---------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//client side
app.use('/', viewRoter);
//api
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRoter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//middleware if the above middlewares can't reach the right url
app.all('*', (req, res, next) => {
  //use global error middlware
  // const err = new Error(`can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

//create global error middleware
app.use(globalError);

module.exports = app;

//data sanitization means clean all the data that comes into the application from malicious code
