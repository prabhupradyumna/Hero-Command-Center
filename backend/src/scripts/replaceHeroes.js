import sequelize from "../config/db.js";
import User from "../models/user.model.js";
import Hero from "../models/Hero.js";

const professionalHeroes = [
  {
    name: "Aiden Brooks",
    power: "Tactical Command",
    city: "New York",
    squad: "Alpha",
    clearanceLevel: 5,
    isActive: true,
  },
  {
    name: "Maya Chen",
    power: "Cyber Defense",
    city: "San Francisco",
    squad: "Sigma",
    clearanceLevel: 4,
    isActive: true,
  },
  {
    name: "Ravi Patel",
    power: "Surveillance and Recon",
    city: "Chicago",
    squad: "Echo",
    clearanceLevel: 3,
    isActive: true,
  },
  {
    name: "Elena Morales",
    power: "Medical Response",
    city: "Houston",
    squad: "Support",
    clearanceLevel: 3,
    isActive: true,
  },
  {
    name: "Noah Williams",
    power: "Logistics and Mobility",
    city: "Seattle",
    squad: "Delta",
    clearanceLevel: 2,
    isActive: true,
  },
  {
    name: "Sophia Ahmed",
    power: "Threat Analysis",
    city: "Boston",
    squad: "Intel",
    clearanceLevel: 4,
    isActive: true,
  },
];

async function replaceHeroes() {
  try {
    await sequelize.authenticate();

    let owner = await User.findOne({ order: [["id", "ASC"]] });

    if (!owner) {
      owner = await User.create({
        name: "System Admin",
        email: "admin@hero-command.local",
        password: "Admin@12345",
        role: "admin",
      });
    }

    await sequelize.query('DELETE FROM "MissionAssignments";').catch(() => {
      // MissionAssignments may not exist yet in early environments
    });

    await Hero.destroy({
      where: {},
      force: true,
      truncate: true,
      cascade: true,
      restartIdentity: true,
    });

    const rows = professionalHeroes.map((hero) => ({
      ...hero,
      userId: owner.id,
    }));

    const created = await Hero.bulkCreate(rows);

    console.log(`Replaced heroes successfully. Inserted ${created.length} heroes.`);
    console.table(created.map((hero) => ({ id: hero.id, name: hero.name, squad: hero.squad, city: hero.city })));
  } catch (error) {
    console.error("Failed to replace heroes:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

replaceHeroes();
