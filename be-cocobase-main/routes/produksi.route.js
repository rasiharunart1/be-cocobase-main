const {
    createProduksi,
    getAllProduksi,
    getProduksiById,
    updateProduksi,
    deleteProduksi,
    updateProduksiStatus,
  } = require("../controllers/produksi.controller");
  const router = require("express").Router();
  const verifyToken = require("../libs/verifyToken");
  
  router.get("/", verifyToken, getAllProduksi);
  router.get("/:id", verifyToken, getProduksiById);
  router.post("/", verifyToken, createProduksi);
  router.put("/status/:id", verifyToken, updateProduksiStatus);
  router.put("/:id", verifyToken, updateProduksi);
  router.delete("/:id", verifyToken, deleteProduksi);
  
  module.exports = router;
  