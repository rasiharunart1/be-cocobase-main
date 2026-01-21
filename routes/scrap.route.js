const {
    createScrap,
    getAllScrap,
    updateScrap,
    deleteScrap,
  } = require("../controllers/scrap.controller");
  const router = require("express").Router();
  const verifyToken = require("../libs/verifyToken");
  
  router.get("/", verifyToken, getAllScrap);
  router.post("/", verifyToken, createScrap);
  router.put("/:id", verifyToken, updateScrap);
  router.delete("/:id", verifyToken, deleteScrap);
  
  module.exports = router;
  