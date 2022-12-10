const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require('dotenv').config();

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send('Service Assignment Backend Server Running')
})



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@cluster0.6sdbvb3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



const verifyToken = (req, res, next) =>{
    const authHeaderToken = req.headers.authorization;

    if(!authHeaderToken){
        return res.status(401).send({message: 'unauthorized access'});
    }
    const token = authHeaderToken.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
}


async function run(){
    try{

        const serviceCollection = client.db('assigment').collection('serives');
        const reviewCollection = client.db('assigment').collection('reviews');

        app.post('/jsonToken', (req, res) =>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d'})
            res.send({token})
        })

        app.get('/services', async(req, res) => {
            let query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/services/latest', async(req, res) => {
            let query = {}
            const cursor = serviceCollection.find(query).sort({ "_id": -1 }).limit(3);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/services/:id', async(req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })


        // for all review and review by specific user id
        app.get('/reviews', async(req, res) => {

            let query = {};
            if (req.query.id) {
                query = {
                    userid: req.query.id
                }
            }
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        // review single id
        app.get('/review/:id', async(req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const review = await reviewCollection.findOne(query);
            res.send(review);
        })

        // review by service id for individual service review
        app.get('/reviews/:id', async(req, res) => {
            const id = req.params.id;
            const query = { serviceId: id };
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
        

        app.post('/addreview', async(req, res)=> {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        })

        app.post('/services', verifyToken, async(req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result);
        })

        app.patch('/review/:reviewid', verifyToken, async(req, res)=> {
            const id = req.params.reviewid;
            const message = req.body.review
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set:{
                    review: message
                }
            }
            const result = await reviewCollection.updateOne(query, updatedDoc);
            res.send(result);
        })

        app.delete('/review/:reviewid', verifyToken, async(req, res)=> {
            console.log('working')
            const id = req.params.reviewid;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        });

    }
    finally{

    }
}


run().catch(error => console.log(error))


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})