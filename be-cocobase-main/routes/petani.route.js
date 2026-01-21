const {
  createPetani,
  getAllPetani,
  getPetaniById,
  updatePetani,
  deletePetani,
} = require("../controllers/petani.controller");
const router = require("express").Router();
const verifyToken = require("../libs/verifyToken");

router.get("/", verifyToken, getAllPetani);
router.get("/:id", verifyToken, getPetaniById);
router.post("/", verifyToken, createPetani);
router.put("/:id", verifyToken, updatePetani);
router.delete("/:id", verifyToken, deletePetani);

module.exports = router;
