require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

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

/*
Log res.json structure:
{
  username: "fcc_test",
  count: 1,
  _id: "5fb5853f734231456ccb3b05",
  log: [{
    description: "test",
    duration: 60,
    date: "Mon Jan 01 1990",
  }]
}

*/

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

app.post('/api/users/:_id/excercises', async (req, res) => {
  // get user input
  const userId = req.params._id // ???
  const userDescr = req.body.description
  let duration = req.body.duration
  let userDate = req.body.date // optional, set to current date if not submitted
  let formattedDate
  // ta form data med description och duration. Date valbart, om inte angivet sätt dagens datum med Date (använd method toDateString() för att formatera datumet)
  duration = Number(duration)

  // make sure dscription is string and duration is number
  if (typeof userDescr !== 'string' || typeof duration !== 'number') {
    console.error('workout description must be a string and workout duration must be a number.')
  }

  // check if date is entered, else assigne todays date + format according to requirements
  if (userDate === '') {
    userDate = new Date()
    formattedDate = userDate.toDateString()
  }

// res.json object med user object där exercisefield är tillagt

})

// create get routs
app.get('/api/users', async (req, res) => {
  console.log('outside try catch')
  try {
    // find all users in db
    console.log('trying to fetch from db')
    const results = await User.find()
    console.log(results)
    // array to hold result
    const userList = []
    // loop over each result in the db call
    console.log('before forEach loop')
    results.forEach((result) => {
      // push each result as object to array
      console.log('before array.push')
      userList.push({ username: result.username, _id: result._id })
    })
    console.log('before res.send')
    // return array
    res.send(userList)
    
  // catch error
  } catch (err) {
    console.error(err)
    res.status(500).json('server error')
  }
})

// GET /api/users/:_id/logs
// res.json svar med alla träningspass för användaren, med count som visar antalet träningspass registrerade för användaren
// i json svaret ska en array finnas med, i vilken varje index ska vara ett object för varje träningspass som är tillagt för användaren
// detta object ska ha samma struktur som POST /api/users/:_id/exercises
// description ska vara en string
// duration ska vara ett nummer
// date ska vara en string formaterad som toDateString
// man ska kunna lägga till from, to och limit parametrar till anropet i url:en för att begärnsa svaret.
// from och to är datum med format yyyy-mm-dd
// limit är int -> antalet loggar som ska returneras



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
