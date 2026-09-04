/* Shared seed data for file database (used by server.js). */
const STABLE_UIDS = {
  "mdabdulquiyumbadol@gmail.com": "7tFGqtHIuMdJrLEEvBD7ElfNbPC2",
  "sanaul.doptortech@gmail.com": "sanaulAdminUid0000001",
  "rafiq.pm@doptortech.com": "rafiqPmUid00000000001",
  "nabila.lead@doptortech.com": "nabilaLeadUid00000001",
  "tanvir.dev@doptortech.com": "tanvirDevUid0000000001",
  "farhana.dev@doptortech.com": "farhanaDevUid00000001",
  "imran.free@doptortech.com": "imranFreeUid0000000001",
  "antu.doptortech@gmail.com": "antuSalesUid0000000001",
  "protik.doptortech@gmail.com": "protikSalesUid0000001",
  "tauhid.doptortech@gmail.com": "tauhidSalesUid0000001",
  "adib.doptortech@gmail.com": "adibSalesUid0000000001",
  "badol.doptortech@gmail.com": "badolSalesUid0000000001"
};

function newId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 20; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function buildSeedData() {
  function authEntry(email, password) {
    const key = email.trim().toLowerCase();
    return {
      key,
      record: { uid: STABLE_UIDS[key] || newId(), email: email.trim(), password: String(password) }
    };
  }

  const authList = [
    authEntry("mdabdulquiyumbadol@gmail.com", "1234567"),
    authEntry("sanaul.doptortech@gmail.com", "12345678"),
    authEntry("rafiq.pm@doptortech.com", "12345678"),
    authEntry("nabila.lead@doptortech.com", "12345678"),
    authEntry("tanvir.dev@doptortech.com", "12345678"),
    authEntry("farhana.dev@doptortech.com", "12345678"),
    authEntry("imran.free@doptortech.com", "12345678"),
    authEntry("antu.doptortech@gmail.com", "1234567"),
    authEntry("protik.doptortech@gmail.com", "1234567"),
    authEntry("tauhid.doptortech@gmail.com", "1234567"),
    authEntry("adib.doptortech@gmail.com", "1234567"),
    authEntry("badol.doptortech@gmail.com", "1234567")
  ];
  const auth = {};
  authList.forEach(({ key, record }) => { auth[key] = record; });

  const uid = email => auth[email.trim().toLowerCase()].uid;
  const store = { settings: { company: { salesTarget: 35000, deliveryTarget: 8 } } };

  function put(col, id, doc) {
    if (!store[col]) store[col] = {};
    store[col][id] = doc;
  }

  put("users", uid("mdabdulquiyumbadol@gmail.com"), {
    name: "Admin", role: "Admin", team: "", workHours: "10am–8pm GMT+6", timezone: "GMT+6",
    contact: "mdabdulquiyumbadol@gmail.com", active: true, profiles: []
  });
  put("users", uid("sanaul.doptortech@gmail.com"), {
    name: "Sanaul", role: "Admin", team: "Leadership", workHours: "10am–7pm GMT+6", timezone: "GMT+6",
    contact: "sanaul.doptortech@gmail.com", active: true, profiles: []
  });
  put("users", uid("rafiq.pm@doptortech.com"), {
    name: "Rafiq Hasan", role: "Project Manager", team: "Delivery", workHours: "9am–6pm GMT+6", timezone: "GMT+6",
    contact: "rafiq.pm@doptortech.com", active: true, profiles: ["Web", "Mobile"]
  });
  put("users", uid("nabila.lead@doptortech.com"), {
    name: "Nabila Rahman", role: "Team Lead", team: "Team Alpha", workHours: "10am–7pm GMT+6", timezone: "GMT+6",
    contact: "nabila.lead@doptortech.com", active: true, profiles: ["Web", "WordPress"]
  });
  put("users", uid("tanvir.dev@doptortech.com"), {
    name: "Tanvir Ahmed", role: "Developer", team: "Team Alpha", workHours: "10am–7pm GMT+6", timezone: "GMT+6",
    contact: "tanvir.dev@doptortech.com", active: true, profiles: ["Web", "WordPress"], monthlyDeliveryTarget: 4
  });
  put("users", uid("farhana.dev@doptortech.com"), {
    name: "Farhana Islam", role: "Developer", team: "Team Alpha", workHours: "11am–8pm GMT+6", timezone: "GMT+6",
    contact: "farhana.dev@doptortech.com", active: true, profiles: ["Mobile", "UI/UX"], monthlyDeliveryTarget: 3
  });
  put("users", uid("imran.free@doptortech.com"), {
    name: "Imran Hossain", role: "Freelancer", team: "External", workHours: "flexible GMT+6", timezone: "GMT+6",
    contact: "imran.free@doptortech.com", active: true, profiles: ["SEO", "WordPress"], monthlyDeliveryTarget: 2
  });
  put("users", uid("antu.doptortech@gmail.com"), {
    name: "Antu", role: "Sales", team: "Sales", workHours: "10am–8pm GMT+6", timezone: "GMT+6",
    contact: "antu.doptortech@gmail.com", active: true, profiles: [], monthlyTarget: 8000
  });
  put("users", uid("protik.doptortech@gmail.com"), {
    name: "Protik", role: "Sales", team: "Sales", workHours: "10am–8pm GMT+6", timezone: "GMT+6",
    contact: "protik.doptortech@gmail.com", active: true, profiles: [], monthlyTarget: 10000
  });
  put("users", uid("tauhid.doptortech@gmail.com"), {
    name: "Tauhid", role: "Sales", team: "Sales", workHours: "11am–8pm GMT+6", timezone: "GMT+6",
    contact: "tauhid.doptortech@gmail.com", active: true, profiles: [], monthlyTarget: 6000
  });
  put("users", uid("adib.doptortech@gmail.com"), {
    name: "Adib", role: "Sales", team: "Sales", workHours: "10am–7pm GMT+6", timezone: "GMT+6",
    contact: "adib.doptortech@gmail.com", active: true, profiles: [], monthlyTarget: 7000
  });
  put("users", uid("badol.doptortech@gmail.com"), {
    name: "Badol", role: "Sales", team: "Sales", workHours: "12pm–9pm GMT+6", timezone: "GMT+6",
    contact: "badol.doptortech@gmail.com", active: true, profiles: [], monthlyTarget: 8000
  });

  store.profiles = {
    tag_web: { name: "Web Development", gigNames: ["React", "Next.js", "WordPress", "Shopify", "Laravel"] },
    tag_mobile: { name: "Mobile App", gigNames: ["Flutter", "React Native", "iOS", "Android"] },
    tag_seo: { name: "SEO", gigNames: ["On-page SEO", "Technical SEO", "Link Building"] },
    tag_uiux: { name: "UI/UX Design", gigNames: ["Figma", "Landing Page", "Dashboard UI"] },
    tag_wp: { name: "WordPress", gigNames: ["Theme Dev", "Plugin Dev", "WooCommerce"] }
  };
  store.stages = {
    stg_discovery: { name: "Discovery", isDelivery: false },
    stg_design: { name: "Design", isDelivery: false },
    stg_dev: { name: "Development", isDelivery: false },
    stg_qa: { name: "QA", isDelivery: false },
    stg_delivered: { name: "Delivered", isDelivery: true }
  };
  store.statuses = {
    sts_ns: { name: "Not Started", isDelivery: false, isDelayed: false },
    sts_ip: { name: "In Progress", isDelivery: false, isDelayed: false },
    sts_wait: { name: "Waiting on Client", isDelivery: false, isDelayed: true },
    sts_rev: { name: "In Review", isDelivery: false, isDelayed: false },
    sts_done: { name: "Completed", isDelivery: true, isDelayed: false },
    sts_hold: { name: "On Hold", isDelivery: false, isDelayed: true }
  };

  const uidAntu = uid("antu.doptortech@gmail.com");
  const uidProtik = uid("protik.doptortech@gmail.com");
  const uidTauhid = uid("tauhid.doptortech@gmail.com");
  const uidAdib = uid("adib.doptortech@gmail.com");
  const uidBadol = uid("badol.doptortech@gmail.com");
  const uidNabila = uid("nabila.lead@doptortech.com");
  const uidTanvir = uid("tanvir.dev@doptortech.com");
  const uidFarhana = uid("farhana.dev@doptortech.com");
  const uidImran = uid("imran.free@doptortech.com");
  const uidRafiq = uid("rafiq.pm@doptortech.com");

  put("clients", "cli_novatech", { name: "NovaTech Ltd", companyProfile: "SaaS startup — corporate website + lead forms.", assignedSalesRep: uidAntu });
  put("clients", "cli_orbit", { name: "Orbit Systems", companyProfile: "B2B CRM for distributors in Dhaka.", assignedSalesRep: uidProtik });
  put("clients", "cli_greenleaf", { name: "GreenLeaf Organics", companyProfile: "Organic grocery brand needing local SEO.", assignedSalesRep: uidTauhid });
  put("clients", "cli_brightshop", { name: "BrightShop BD", companyProfile: "Fashion e-commerce on WordPress/WooCommerce.", assignedSalesRep: uidAdib });
  put("clients", "cli_metro", { name: "Metro Studio", companyProfile: "Architecture studio — brand UI kit.", assignedSalesRep: uidAntu });
  put("clients", "cli_harbor", { name: "Harbor Logistics", companyProfile: "Freight company landing page + quote form.", assignedSalesRep: uidBadol });
  put("clients", "cli_pulse", { name: "Pulse Analytics", companyProfile: "Internal dashboard for campaign reporting.", assignedSalesRep: uidProtik });
  put("clients", "cli_kidslearn", { name: "KidsLearn", companyProfile: "EdTech — parent/student mobile app.", assignedSalesRep: uidAdib });
  put("clients", "cli_cafemenu", { name: "CafeMenu", companyProfile: "Cafe chain digital menu (WordPress).", assignedSalesRep: uidTauhid });
  put("clients", "cli_rahman", { name: "Rahman & Associates", companyProfile: "Law firm brochure site + appointment booking.", assignedSalesRep: uidBadol });
  put("clients", "cli_fittrack", { name: "FitTrack", companyProfile: "Fitness brand identity and landing visuals.", assignedSalesRep: uidAntu });

  put("projects", "prj_novatech", {
    profileName: "NovaTech Corporate Site", clientId: "cli_novatech", teamLeadId: uidNabila,
    assignedDevId: uidTanvir, salesOwnerId: uidAntu, assignedPMId: uidRafiq,
    status: "In Progress", priority: "High", startDate: "2026-08-04", deadline: "2026-09-15",
    budget: 4500, profileTags: ["Web Development"], developingStage: "Development",
    extensions: 0, reviewRating: null, createdAt: "2026-08-04"
  });
  put("projects", "prj_orbit", {
    profileName: "Orbit CRM App", clientId: "cli_orbit", teamLeadId: uidNabila,
    assignedDevId: uidFarhana, salesOwnerId: uidProtik, assignedPMId: uidRafiq,
    status: "In Progress", priority: "High", startDate: "2026-08-10", deadline: "2026-09-30",
    budget: 8200, profileTags: ["Mobile App"], developingStage: "Development",
    extensions: 1, reviewRating: null, createdAt: "2026-08-10"
  });
  put("projects", "prj_greenleaf", {
    profileName: "GreenLeaf Local SEO", clientId: "cli_greenleaf", teamLeadId: uidNabila,
    assignedDevId: uidImran, salesOwnerId: uidTauhid, assignedPMId: uidRafiq,
    status: "Waiting on Client", priority: "Medium", startDate: "2026-07-20", deadline: "2026-08-20",
    budget: 1800, profileTags: ["SEO"], developingStage: "QA",
    extensions: 2, reviewRating: null, createdAt: "2026-07-20"
  });
  put("projects", "prj_brightshop", {
    profileName: "BrightShop Woo Store", clientId: "cli_brightshop", teamLeadId: uidNabila,
    assignedDevId: uidTanvir, salesOwnerId: uidAdib, assignedPMId: uidRafiq,
    status: "Completed", priority: "Medium", startDate: "2026-08-01", deadline: "2026-08-25",
    budget: 3200, profileTags: ["WordPress"], developingStage: "Delivered",
    extensions: 0, reviewRating: 4.6, createdAt: "2026-08-01", completedAt: "2026-08-22", deliveredAt: "2026-08-22"
  });
  put("projects", "prj_metro", {
    profileName: "Metro UI Kit", clientId: "cli_metro", teamLeadId: uidNabila,
    assignedDevId: uidFarhana, salesOwnerId: uidAntu, assignedPMId: uidRafiq,
    status: "In Review", priority: "Medium", startDate: "2026-08-12", deadline: "2026-09-05",
    budget: 2100, profileTags: ["UI/UX Design"], developingStage: "QA",
    extensions: 0, reviewRating: null, createdAt: "2026-08-12"
  });
  put("projects", "prj_harbor", {
    profileName: "Harbor Landing Page", clientId: "cli_harbor", teamLeadId: "",
    assignedDevId: uidImran, salesOwnerId: uidBadol, assignedPMId: uidRafiq,
    status: "On Hold", priority: "Low", startDate: "2026-07-28", deadline: "2026-08-25",
    budget: 1500, profileTags: ["Web Development"], developingStage: "Design",
    extensions: 1, reviewRating: null, createdAt: "2026-07-28"
  });
  put("projects", "prj_pulse", {
    profileName: "Pulse Campaign Dashboard", clientId: "cli_pulse", teamLeadId: uidNabila,
    assignedDevId: uidTanvir, salesOwnerId: uidProtik, assignedPMId: uidRafiq,
    status: "Completed", priority: "High", startDate: "2026-07-05", deadline: "2026-08-10",
    budget: 5600, profileTags: ["Web Development"], developingStage: "Delivered",
    extensions: 0, reviewRating: 4.8, createdAt: "2026-07-05", completedAt: "2026-08-08", deliveredAt: "2026-08-08"
  });
  put("projects", "prj_kidslearn", {
    profileName: "KidsLearn Mobile App", clientId: "cli_kidslearn", teamLeadId: uidNabila,
    assignedDevId: uidFarhana, salesOwnerId: uidAdib, assignedPMId: uidRafiq,
    status: "Not Started", priority: "High", startDate: "2026-08-25", deadline: "2026-10-15",
    budget: 9000, profileTags: ["Mobile App"], developingStage: "Discovery",
    extensions: 0, reviewRating: null, createdAt: "2026-08-25"
  });
  put("projects", "prj_cafemenu", {
    profileName: "CafeMenu Digital Menu", clientId: "cli_cafemenu", teamLeadId: "",
    assignedDevId: uidImran, salesOwnerId: uidTauhid, assignedPMId: uidRafiq,
    status: "In Progress", priority: "Low", startDate: "2026-08-18", deadline: "2026-09-10",
    budget: 900, profileTags: ["WordPress"], developingStage: "Development",
    extensions: 0, reviewRating: null, createdAt: "2026-08-18"
  });
  put("projects", "prj_rahman", {
    profileName: "Rahman Law Firm Site", clientId: "cli_rahman", teamLeadId: uidNabila,
    assignedDevId: uidTanvir, salesOwnerId: uidBadol, assignedPMId: uidRafiq,
    status: "Completed", priority: "Medium", startDate: "2026-08-02", deadline: "2026-08-28",
    budget: 4800, profileTags: ["Web Development"], developingStage: "Delivered",
    extensions: 0, reviewRating: 4.4, createdAt: "2026-08-02", completedAt: "2026-08-28", deliveredAt: "2026-08-28"
  });
  put("projects", "prj_fittrack", {
    profileName: "FitTrack Brand Landing", clientId: "cli_fittrack", teamLeadId: uidNabila,
    assignedDevId: uidFarhana, salesOwnerId: uidAntu, assignedPMId: uidRafiq,
    status: "Completed", priority: "Medium", startDate: "2026-08-03", deadline: "2026-08-20",
    budget: 2400, profileTags: ["UI/UX Design"], developingStage: "Delivered",
    extensions: 0, reviewRating: 4.7, createdAt: "2026-08-03", completedAt: "2026-08-18", deliveredAt: "2026-08-18"
  });

  put("dailyUpdates", "upd_01", {
    projectId: "prj_novatech", userId: uidTanvir, date: "2026-08-28",
    note: "Homepage hero + services section done. Waiting on brand photos from client.",
    createdAt: Date.parse("2026-08-28T10:20:00Z")
  });
  put("dailyUpdates", "upd_02", {
    projectId: "prj_orbit", userId: uidFarhana, date: "2026-08-27",
    note: "Inventory module API wired. Starting dealer login flow tomorrow.",
    createdAt: Date.parse("2026-08-27T16:05:00Z")
  });
  put("dailyUpdates", "upd_03", {
    projectId: "prj_greenleaf", userId: uidImran, date: "2026-08-21",
    note: "Blocked — client has not sent GSC / GBP access yet.",
    createdAt: Date.parse("2026-08-21T09:40:00Z")
  });
  put("dailyUpdates", "upd_04", {
    projectId: "prj_metro", userId: uidFarhana, date: "2026-08-26",
    note: "UI kit v2 sent for review. Spacing tokens updated per last feedback.",
    createdAt: Date.parse("2026-08-26T14:12:00Z")
  });
  put("dailyUpdates", "upd_05", {
    projectId: "prj_cafemenu", userId: uidImran, date: "2026-08-28",
    note: "Menu categories + item cards live on staging. Need cafe photos.",
    createdAt: Date.parse("2026-08-28T18:30:00Z")
  });
  put("dailyUpdates", "upd_06", {
    projectId: "prj_brightshop", userId: uidTanvir, date: "2026-08-22",
    note: "Woo store handed over. Payment + shipping tested with sample order.",
    createdAt: Date.parse("2026-08-22T11:00:00Z")
  });

  put("clientNotes", "note_01", {
    projectId: "prj_novatech", projectName: "NovaTech Corporate Site", clientName: "NovaTech Ltd",
    date: "2026-08-15", addedBy: uidAntu,
    content: "Client wants a case-study section on the homepage, not a separate page."
  });
  put("clientNotes", "note_02", {
    projectId: "prj_orbit", projectName: "Orbit CRM App", clientName: "Orbit Systems",
    date: "2026-08-19", addedBy: uidProtik,
    content: "Must support Bangla + English in the dealer portal from day one."
  });
  put("clientNotes", "note_03", {
    projectId: "prj_greenleaf", projectName: "GreenLeaf Local SEO", clientName: "GreenLeaf Organics",
    date: "2026-08-20", addedBy: uidTauhid,
    content: "Owner travelling until 5 Sep — delayed credentials until then."
  });
  put("clientNotes", "note_04", {
    projectId: "prj_harbor", projectName: "Harbor Landing Page", clientName: "Harbor Logistics",
    date: "2026-08-12", addedBy: uidBadol,
    content: "Paused until they confirm the new logo. Do not publish current draft."
  });
  put("clientNotes", "note_05", {
    projectId: "prj_kidslearn", projectName: "KidsLearn Mobile App", clientName: "KidsLearn",
    date: "2026-08-26", addedBy: uidAdib,
    content: "Kickoff next week. They will share Figma + API docs on Monday."
  });

  return {
    auth,
    store,
    meta: {
      doptor_dummy_seed_v: "1",
      doptor_store_migration: 2
    }
  };
}

module.exports = { buildSeedData, STABLE_UIDS };
