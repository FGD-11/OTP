const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = {
    code,
    expiredAt: Date.now() + 5 * 60 * 1000,
  };

  try {
    await transporter.sendMail({
      from: `"OTP Bot" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Kode OTP Anda",
      html: `<p>Kode OTP Anda adalah: <b>${code}</b></p>`,
    });
    res.status(200).send("OTP terkirim");
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal kirim OTP");
  }
});

app.post("/verifikasi-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).send("OTP tidak ditemukan");
  if (Date.now() > record.expiredAt)
    return res.status(400).send("OTP kadaluarsa");
  if (record.code !== otp) return res.status(400).send("OTP salah");

  delete otpStore[email];
  res.status(200).send("OTP valid");
});

app.get("/", (req, res) => {
  res.send("OTP server aktif ✅");
});

app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
