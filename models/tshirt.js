const mongoose = require("mongoose");


const tshirtSchema = new mongoose.Schema({
    name: String,
    color: String,
  })

  const Tshirt = mongoose.model("Tshirt", tshirtSchema); 

  module.exports = Tshirt;