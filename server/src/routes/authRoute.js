const express = require("express");
const router = express.Router();
const cors = require("cors");
const {test,signup, signin, profile, logout, googleCallback}  = require("../controllers/authControl" );
const { googleSignin } = require("../controllers/authControl");
const passport = require("passport");
// const GoogleStrategy = require("passport-google-oidc")
// router.use(
//   cors({
//     credentials: true,
//     origin: "http://localhost:5173" || "http://localhost:5174",
//     // origin: "http://localhost:5174",
//     methods: ["GET", "POST"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
router.get("/", test);
router.get('/login/federated/google',googleSignin);
router.get("/auth/google/callback",googleCallback);
router.post("/signin",signin )
router.post('/signup',signup)
router.get('/profile' , profile)
router.get('/logout' , logout)
module.exports = router;
