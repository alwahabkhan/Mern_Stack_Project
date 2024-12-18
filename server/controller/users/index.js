const User = require("../../model/users/index.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "NOTESAPI";
const nodemailer = require("nodemailer");

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "7d" });
};

const handleRegisterUser = async (req, res) => {
  const { firstname, lastname, email, password, gender, dateofbirth, role } =
    req.body;
  try {
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      gender,
      dateofbirth,
      role,
    });

    const userWithoutPassword = result.toObject();
    delete userWithoutPassword.password;

    const token = generateToken(result);

    res.status(200).json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const handleLoginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExist = await User.findOne({ email });
    if (!userExist) {
      return res.status(400).json({ message: "User not found" });
    }

    const matchPassword = await bcrypt.compare(password, userExist.password);

    if (!matchPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userWithoutPassword = userExist.toObject();
    delete userWithoutPassword.password;

    const token = generateToken(userExist);

    res.status(200).json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const handleForgetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userExist = await User.findOne({ email });
    if (!userExist) {
      return res.send({ Status: "User not found" });
    }

    const token = jwt.sign({ id: userExist._id }, SECRET_KEY);

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "alwahabalikhan8@gmail.com",
        pass: "agvq qtxn vmoo mwsy",
      },
    });

    var mailOptions = {
      from: "alwahabalikhan8@gmail.com",
      to: "muhammadalwahabalikhan@gmail.com",
      subject: "Reset your password",
      text: `http://localhost:3000/reset-password/${userExist._id}/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        return res.send({ Status: "Success" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

const handleResetPassword = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.json({ Status: "Error with token" });
    } else {
      bcrypt
        .hash(password, 10)
        .then((hash) => {
          User.findByIdAndUpdate({ _id: id }, { password: hash })
            .then(() => res.send({ Status: "Success" }))
            .catch((err) => res.send({ Status: err }));
        })
        .catch((err) => res.send({ Status: err }));
    }
  });
};

module.exports = {
  handleRegisterUser,
  handleLoginUser,
  handleForgetPassword,
  handleResetPassword,
};
