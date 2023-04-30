const axios =require("axios")
const express = require("express")
const Redis = require("ioredis");
const app = express()
const port = 4000
const redis = new Redis();


app.get("/", async(req, res) => {
    const isPhotosCached=await redis.exists("photos") === 1
    if(isPhotosCached){
        console.log("From cache")
        const photos=await redis.get("photos")
        return res.send(photos)
    }
    const {data}=await axios.get("https://jsonplaceholder.typicode.com/photos")
    res.send(data)
    redis.set("photos",JSON.stringify(data),"EX",2000)
    console.log("From API")
})


app.get("/photos/:id",async(req,res)=>{
    const {id}=req.params
    const isPhotosCached=await redis.exists(`photos${id}`) === 1
    if(isPhotosCached){
        console.log("From cache")

        const photo=await redis.get(`photos${id}`)
        return res.send(photo)
    }
    const {data}=await axios.get(`https://jsonplaceholder.typicode.com/photos/${id}`)
    res.send(data)
    redis.set(`photos${data.id}`,JSON.stringify(data),"EX",2000)
    console.log("From API")

})

// Clear only photos cache
app.get("/clear-cache",async(req,res)=>{
    const query=req.query.key.trim()
    const isQueryCached=await redis.exists(query)===1
    if(isQueryCached){
        redis.del(query)
        res.send("Cache cleared")
    }
})


// Clear all individual photo cache
app.get("/clear-all-photo",async(req,res)=>{
    const getallkeys=await redis.keys("photos*")
    if(getallkeys.length>0){
        getallkeys.forEach(async(key)=>{
            await redis.del(key)
        })
        return res.send("All photo cache cleared")
    }
return res.send("No photo cache found")

   
})
app.listen(port)