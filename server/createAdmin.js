const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const phone = "9999999999";
    const password = "Admin@123";

    const hashedPassword = await bcrypt.hash(password, 10);

    let admin = await User.findOne({ phone });

    if (admin) {
      admin.name = "Admin";
      admin.role = "admin";
      admin.password = hashedPassword;
      admin.isActive = true;

      await admin.save();

      console.log("Admin account updated successfully");
    } else {
      admin = await User.create({
        name: "Admin",
        phone,
        role: "admin",
        password: hashedPassword,
        isActive: true,
      });

      console.log("Admin account created successfully");
    }

    console.log("--------------------------------");
    console.log("Admin Phone    :", phone);
    console.log("Admin Password :", password);
    console.log("Role           :", admin.role);
    console.log("--------------------------------");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();