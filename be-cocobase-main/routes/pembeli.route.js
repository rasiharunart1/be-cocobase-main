const {
    createPembeli,
    getAllPembeli,
    getPembeliById,
    updatePembeli,
    deletePembeli,
  } = require("../controllers/pembeli.controller");
  const router = require("express").Router();
  const verifyToken = require("../libs/verifyToken");
  
  router.get("/", verifyToken, getAllPembeli);
  router.get("/:id", verifyToken, getPembeliById);
  router.post("/", verifyToken, createPembeli);
  router.put("/:id", verifyToken, updatePembeli);
  router.delete("/:id", verifyToken, deletePembeli);
  
  module.exports = router;
  