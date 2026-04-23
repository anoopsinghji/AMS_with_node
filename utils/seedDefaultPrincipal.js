const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seedDefaultPrincipal() {
  const principalId = process.env.DEFAULT_PRINCIPAL_ID || "P001";
  const principalName = process.env.DEFAULT_PRINCIPAL_NAME || "Principal";
  const principalPassword = process.env.DEFAULT_PRINCIPAL_PASSWORD || "principal123";

  const existingPrincipal = await User.findOne({
    $or: [{ role: "principal" }, { id: principalId }],
  }).lean();

  if (existingPrincipal) {
    return;
  }

  const hashedPassword = await bcrypt.hash(principalPassword, 10);

  await User.create({
    id: principalId,
    name: principalName,
    password: hashedPassword,
    role: "principal",
    assignedClass: "",
  });

  console.log(`Default principal created with id: ${principalId}`);
}

module.exports = {
  seedDefaultPrincipal,
};
