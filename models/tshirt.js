const mongoose = require("mongoose");

const tshirtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  // Add a reference to the User model
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Tshirt = mongoose.model("Tshirt", tshirtSchema);

module.exports = Tshirt;
