const {
    createTransaksi,
    getAllTransaksi,
    getTransaksiById,
    updateTransaksi,
    deleteTransaksi,
  } = require("../controllers/transaksi.controller");
  const router = require("express").Router();
  const verifyToken = require("../libs/verifyToken");
  
  router.get("/", verifyToken, getAllTransaksi);
  router.get("/:id", verifyToken, getTransaksiById);
  router.post("/", verifyToken, createTransaksi);
  router.put("/:id", verifyToken, updateTransaksi);
  router.delete("/:id", verifyToken, deleteTransaksi);
  
  module.exports = router;
  