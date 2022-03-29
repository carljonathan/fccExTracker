require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const { receiveMessageOnPort } = require('worker_threads')

// connect to mongoDB
mongoose.connect(process.env.MONGO_URI)

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('public'))

// create schema
const Schema = mongoose.Schema

// schema for user
const userSchema = new Schema({
  username: { type: String, required: true }
})

// schema for exercise
const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true },
  userId: { type: String, required: true }
})

// create mongoose models for user and exercise
const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// create post routs
// route to create a new user
app.post('/api/users', async (req, res) => {
  // get user input from form
  const userInput = req.body.username
  // make sure user has entered a valid username, i.e. not blank and not nothing
  if (!userInput || userInput === '') {
    res.json({ error: 'invalid input - empty username is not allowed' })
  }
  // if valid name, try to create a user in the db
  try {
    // create new user document
    const newUser = new User({
      username: userInput
    })
    // save new doc
    await newUser.save()
    // retrun new user details as json
    res.json({ username: newUser.username, _id: newUser._id })
    // catch and log error
  } catch (err) {
    console.error(err)
    res.status(500).json('Server Error')
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  // get user input
  const userId = req.params._id
  const userDescr = req.body.description
  let duration = req.body.duration
  let userDate = req.body.date // optional, set to current date if not submitted

  // get username
  const findUser = await User.findOne({ _id: userId })

  // convert duration to number
  duration = Number(duration)

  // make sure dscription is string and duration is number
  if (typeof userDescr !== 'string' || typeof duration !== 'number') {
    console.error('workout description must be a string and workout duration must be a number.')
  }

  // check if date is not entered and assign todays date if so
  if (userDate === '') {
    userDate = Date.now()
  }

  // create date object
  let newDate = new Date(userDate)
  // make sure user date is valid, else set as today
  if (isNaN(newDate)) {
    newDate = new Date(Date())
  }

  // set date time to midnight
  newDate.setHours(00)
  newDate.setMinutes(00)
  newDate.setSeconds(00)

  // format date as date string, per requirement
  const formattedDate = newDate.toDateString()
  
  // create new doc with values
  const entry = new Exercise({
    username: findUser.username,
    description: userDescr,
    duration: duration,
    date: newDate,
    userId: userId
  })

  // save the doc
  await entry.save()

  // return required as JSON
  res.json({
    username: entry.username,
    description: entry.description,
    duration: entry.duration,
    date: formattedDate,
    _id: userId
  })
})

// create get routs
app.get('/api/users', async (req, res) => {
  try {
    // find all users in db
    const results = await User.find()
    // array to hold result
    const userList = []
    // loop over each result in the db call
    results.forEach((result) => {
      // push each result as object to array
      userList.push({ username: result.username, _id: result._id })
    })
    // return array
    res.send(userList)
  // catch error
  } catch (err) {
    console.error(err)
    res.status(500).json('server error')
  }
})

// GET /api/users/:_id/logs
app.get('/api/users/:_id/logs', async (req, res) => {
  // get all url parameters
  const userId = req.params._id
  const reqFrom = req.query.from ? new Date(req.query.from) : 0
  const reqTo = req.query.to ? new Date(req.query.to) : new Date(new Date().setFullYear(new Date().getFullYear() + 10000))
  const reqLimit = req.query.limit

  // find the user document
  const user = await User.findOne({ _id: userId })

  // find all exercises for user in question
  const logs = await Exercise.find({ userId: userId })

  // arrange constructor to hold exercise log properties
  function Log (description, duration, date) {
    this.description = description;
    this.duration = duration;
    this.date = date;
  }

  // array to hold logs as per requirements
  const resLogs = []
  
  // counter
  let count = 0

  // iterate exercies
  for (let i = 0; i < logs.length; i++) {
    // create new object with needed data
    const result = new Log(logs[i].description, logs[i].duration, new Date(logs[i].date))

    // make sure limit is taken into account
    if (!reqLimit || count < reqLimit) {

      // make sure from and to is taken into account
      if (result.date >= reqFrom && result.date <= reqTo) {

        // format date as per requirement before pushing to resLogs array
        result.date = result.date.toDateString()

        // push new object to array and increment counter
        resLogs.push(result)
        count++
      }
    }
  }

  // return JSON as required
  res.json({
    _id: userId,
    username: user.username,
    count: count,
    log: resLogs
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
