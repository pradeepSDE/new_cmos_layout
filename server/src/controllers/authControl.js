const User = require("../models/user");
const { hashedPassword, comparePassword } = require("../helper/auth");
// const passport = require("passport");
const passport = require("../config/passport");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const test = (req, res) => {
  res.json("Hello World! from ");
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const nameExist = await User.findOne({ name: name });
    if (nameExist) {
      return res.json({
        error: "Username already exists",
      });
    }
    if (!name) {
      return res.json({
        error: "please enter your name",
      });
    }
    if (!password || password.length < 8) {
      return res.json({
        error: "password must be at least 8 characters long",
      });
    }
    const exist = await User.findOne({ email });

    if (exist) {
      return res.json({
        error: "email already exists",
      });
    }

    const hashed = await hashedPassword(password);
    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    return res.json(user);
  } catch (error) {
    console.log(error);
  }
  // res.json('p')
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ error: "email not found" });
    }
    const compare = await comparePassword(password, user.password);
    if (compare) {
      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email },
        process.env.JWT_SECRET
      );
      // res.cookie("token", token);
      res.cookie("token", token, {
        httpOnly: true, // Ensures the cookie is not accessible via JavaScript
        secure: true, // Ensures the cookie is only sent over HTTPS
        sameSite: "None", // Required for cross-origin requests
        maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
      });

      return res.json({
        message: "login successful",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        },
      });
    } else {
      return res.json({ error: "password incorrect" });
    }
  } catch (e) {
    console.log(e);
  }
};

const profile = (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, {}, async (err, user) => {
      if (err) throw err;
      const userFull = await User.findById(user.id);
      console.log(userFull)
      res.json(userFull);
    });
  } else {
    res.json(null);
  }
};

const logout = (req, res) => {
  const { token } = req.cookies;
  try {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
  }
};

const googleSignin = passport.authenticate("google", {
  scope: ["openid", "profile", "email"],
});
const googleCallback = (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    async (err, user, info) => {
      if (err || !user) {
        console.log("Auth error:", err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=true`);
      }

      try {
        const token = jwt.sign(
          { id: user._id, name: user.name, email: user.email },
          process.env.JWT_SECRET
        );

        res.cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "None",
          maxAge: 24 * 60 * 60 * 1000,
        });

        return res.redirect(`${process.env.FRONTEND_URL}/layouts`);
      } catch (error) {
        console.error("JWT creation error:", error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=true`);
      }
    }
  )(req, res, next);
};

module.exports = {
  googleCallback,
  googleSignin,
  test,
  signup,
  signin,
  profile,
  logout,
};
