const dotenv = require("dotenv")
dotenv.config()

const express = require("express")
const app = express()

const methodOverride = require("method-override")
const morgan = require("morgan")

const mongoose = require("mongoose")
mongoose.connect(process.env.MONGODB_URI)

mongoose.connection.on("connected", () => {
    console.log(`Connected to MongoDB ${mongoose.connection.name}.`)
})

const Tshirt = require("./models/tshirt.js")

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"))
app.use(morgan("dev"))

app.get("/", async (req, res) => {
    res.render("index.ejs")
})




app.get("/tshirts", async (req, res) => {
    const allTshirts = await Tshirt.find()
    res.render("tshirts/index.ejs", { tshirts: allTshirts })
})



app.get("/tshirts/new", (req, res) => {
    res.render("tshirts/new.ejs");
})

app.get("/tshirts/:tshirtId", async (req, res) => {
    const foundTshirt = await Tshirt.findById(req.params.tshirtId)
    res.render("tshirts/show.ejs", { tshirt: foundTshirt })
})


app.post("/tshirts", async (req, res) => {
    await Tshirt.create(req.body)
    res.redirect("/tshirts")
})

app.delete("/tshirts/:tshirtId", async (req, res) => {
    await Tshirt.findByIdAndDelete(req.params.tshirtId)
    res.redirect("/tshirts")
})


app.get("/tshirts/:tshirtId/edit", async (req, res) => {
    const foundTshirt = await Tshirt.findById(req.params.tshirtId)
    res.render("tshirts/edit.ejs", {
        tshirt: foundTshirt,
    })
})

app.put("/tshirts/:tshirtId", async (req, res) => {
    await Tshirt.findByIdAndUpdate(req.params.tshirtId, req.body)
    res.redirect(`/tshirts/${req.params.tshirtId}`)
})










app.listen(3000, () => {
    console.log("Listening on port 3000");
});
