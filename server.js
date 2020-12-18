// express
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const multer = require('multer')
const sharp = require('sharp')
const storage_options = multer.memoryStorage()
const upload = multer({ storage: storage_options }) ;
const app = express()
const port = process.env.PORT || 3000
const output_classes = require('./classes.json') ;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(helmet())
app.use(cors())

// tfjs
const tfjs = require('@tensorflow/tfjs-node')
let model ;

function log(msg){
   console.log(msg)
}

async function loadModel(){
   try{
      model = await tfjs.loadLayersModel(`file://${__dirname}/model/tfjs_model_vgg16/model.json`)
      log('Model loaded')
   }
   catch(err){
      console.log(err) ;
   }
}

function decodePredictions(array){
   return array.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0) ;
}

async function classify(buffer){
   const img = await sharp(buffer).resize(224,224).toBuffer() ;
   const tf_img = tfjs.node.decodeImage(img, 3) ;
   const expand_img = tfjs.expandDims(tf_img, 0) ;
   const predictions = await model.predict(expand_img) ;
   const index = decodePredictions(predictions.dataSync()) ;
   // console.log(index)
   const species = output_classes[index] ;   
   // console.log(species) ;
   return species ;
}

loadModel()

// sending page 
app.get('/', (req, res) => {
   res.sendFile('index.html')
})

// api for prediction
app.post('/api/predict', upload.single('image') ,(req, res) => {
   if (req.file){
      classify(req.file.buffer).then( (result) => {
         res.send(result) ;
      }).catch(err => {
         res.status(404).send(err) ;
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