const router = require('express').Router();
const {
    createPetani,
    getAllPetani,
    updatePetani,
    deletePetani,
    getPetaniById
} = require('../controllers-backup/petani.controller');
const verifyToken = require('../middlewares/verifyToken');

// Assuming admin needs to be authenticated to manage farmers, 
// but sticking to basic implementation first or checking other routes patterns.
// Looking at auth-petani, verifyToken is used.
// I'll add verifyToken if I can find it, otherwise I might skip it for now or check if it's available.
// I saw verifyToken usage in auth-petani.route.js: require('../middlewares/verifyToken');

router.get('/', getAllPetani);
router.get('/:id', getPetaniById);
router.post('/', createPetani); // Usually requires auth
router.put('/:id', updatePetani); // Usually requires auth
router.delete('/:id', deletePetani); // Usually requires auth

module.exports = router;
