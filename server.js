require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

// connect to mongoDN
mongoose.connect(process.env.MONGI_URI, () => { console.log('connected to mongoDB') })

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
app.post('/api/users', async (req, res) => {
  const userInput = req.body.username
  console.log(userInput)
  if (!userInput || userInput === '') {
    res.json({ error: 'invalid input - empty username is not allowed' })
  }
  console.log(userInput, 'is OK')
  try {
    console.log('inside try')
    const newUser = new User({
      username: userInput
    })
    console.log('newUSer:', newUser)
    console.log('user created OK, will try to save')
    await newUser.save()
    console.log('user saved')
    res.json({ username: newUser.username, _id: newUser._id })
  } catch (err) {
    console.error(err)
    res.status(500).json('Server Error')
  }
})
// res.json({username & id})

// POST/api/users/:_id/exercises
// ta form data med description och duration. Date valbart, om inte angivet sätt dagens datum med Date (använd method toDateString() för att formatera datumet)
// res.json object med user object där exercisefield är tillagt
// description ska vara en string
// duration ska vara ett nummer

// create get routs
// GET /api/users
// res.json array eller res.send array.
// array innehåller json objects med username och id

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
