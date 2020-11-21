// express
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const multer = require('multer')
const storage_options = multer.memoryStorage()
const upload = multer({ storage: storage_options }) ;
const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(helmet())
app.use(cors())

// tfjs
const tfjs = require('@tensorflow/tfjs')
const tfjsnode = require('@tensorflow/tfjs-node')
const mobilenet = require('@tensorflow-models/mobilenet')

let model ;

async function loadModel(){
   try{
      model = await mobilenet.load({
         version: 1,
         alpha: 1
      })
      console.log('Model Loaded')
   }
   catch(err){
      console.log(err) 
      console.log('Retrying..')
      loadModel() ;
   }
}

loadModel()

function readImage(buff){
   const tfimg = tfjsnode.node.decodeImage(Buffer.from(buff, 'base64'))
   return tfimg
}

async function classifyImage(buff){
   const img = readImage(buff)
   const predictions = await model.classify(img)
   return predictions
}

app.get('/', (req, res) => {
   res.sendFile('index.html')
})

app.post('/api/predict', upload.single('image') ,(req, res) => {
   
   if (req.file){
      classifyImage(req.file.buffer).then( result => {
         res.send(JSON.stringify(result.sort( (a, b) => b.probability - a.probability)))
      }).catch( err => {
         res.status(400).send('Error occurred while classification', err) ;
      })
   }
   else{
      res.status(400).send('Error occurred File not recieved to the server')
   }
}) ;

app.get('**', (req, res) => {
   res.status(404).send('Page Not Found') ;
})

app.listen(port, () => {
   console.log(`listening to port: https://localhost:${port}`)
})