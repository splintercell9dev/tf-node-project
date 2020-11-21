// express
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const storage_options = multer.diskStorage({
   destination: function(req, file, cb){
      cb(null, 'uploads')
   },
   filename: function(req, file, cb){
      cb(null, `image${Date.now()+path.extname(file.originalname)}`)
   }
})
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

function readImage(path){
   const buff = fs.readFileSync(path)
   const tfimg = tfjsnode.node.decodeImage(buff)
   return tfimg
}

async function classifyImage(path){
   const img = readImage(path)
   const predictions = await model.classify(img)
   return predictions
}

function deleteFile(path){
   fs.unlinkSync(path)
}

app.get('/', (req, res) => {
   res.sendFile('index.html')
})

app.post('/api/predict', upload.single('image') ,(req, res) => {
   
   if (req.file){
      classifyImage(req.file.path).then( result => {
         res.send(JSON.stringify(result.sort( (a, b) => b.probability - a.probability)))
         deleteFile(req.file.path)
      }).catch( err => {
         res.status(400).send(err) ;
         deleteFile(req.file.path)
      })
   }
   else{
      res.status(400).send('Error occurred File not recieved to the server')
      deleteFile(req.file.path)

   }
}) ;

app.get('**', (req, res) => {
   res.status(404).send('Page Not Found') ;
})

app.listen(port, () => {
   console.log(`listening to port: https://localhost:${port}`)
})