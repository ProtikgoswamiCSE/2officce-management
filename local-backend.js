/* Local Auth + data store. Uses ./database/*.json via server.js when available. */
(function (root) {
  const AUTH_KEY = "doptor_local_auth_users";
  const SESSION_KEY = "doptor_local_session";
  const STORE_KEY = "doptor_local_store";
  const DUMMY_SEED_KEY = "doptor_dummy_seed_v";
  const DUMMY_SEED_VERSION = "1";
  const STORE_MIGRATION_KEY = "doptor_store_migration";
  const STORE_MIGRATION_VERSION = 2;
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
    "badol.doptortech@gmail.com": "badolSalesUid00000001"
  };

  function authError(code, message) {
    const err = new Error(message);
    err.code = code;
    return err;
  }
  function newId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 20; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }
  function clone(v) {
    return v == null ? v : JSON.parse(JSON.stringify(v));
  }
  function readJsonLocal(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }
  function writeJsonLocal(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  let useFileDb = false;
  let memoryStore = {};
  let memoryAuth = {};
  let memoryMeta = {};
  let remoteDbVersion = 0;
  let sseSource = null;
  let storeWriteChain = Promise.resolve();
  let storeWritesInFlight = 0;
  let pendingStoreReload = false;

  function bootstrapFromServer() {
    if (typeof XMLHttpRequest === "undefined") return false;
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "/api/db/bootstrap", false);
      xhr.send();
      if (xhr.status !== 200) return false;
      const data = JSON.parse(xhr.responseText);
      memoryStore = data.store || {};
      memoryAuth = data.auth || {};
      memoryMeta = data.meta || {};
      remoteDbVersion = data.version || 0;
      useFileDb = true;
      startDbEvents();
      return true;
    } catch (_) {
      return false;
    }
  }

  function reloadFromServer(cb) {
    // Never clobber in-memory writes mid-flight — that was dropping
    // newly approved projects before they landed in All Projects.
    if (storeWritesInFlight > 0) {
      pendingStoreReload = true;
      return;
    }
    fetch("/api/db/bootstrap")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (storeWritesInFlight > 0) {
          pendingStoreReload = true;
          return;
        }
        memoryStore = data.store || {};
        memoryAuth = data.auth || {};
        memoryMeta = data.meta || {};
        remoteDbVersion = data.version || remoteDbVersion;
        if (cb) cb();
        notifyAllCollections();
      })
      .catch(e => console.error("db reload failed", e));
  }

  function startDbEvents() {
    if (!useFileDb || typeof EventSource === "undefined") return;
    if (sseSource) sseSource.close();
    sseSource = new EventSource("/api/db/events");
    sseSource.onmessage = ev => {
      try {
        const msg = JSON.parse(ev.data);
        if (!msg.version || msg.version <= remoteDbVersion) return;
        reloadFromServer();
      } catch (e) { console.error(e); }
    };
  }

  function readJson(key, fallback) {
    if (useFileDb && key !== SESSION_KEY) {
      if (key === AUTH_KEY) return clone(memoryAuth);
      if (key === STORE_KEY) return clone(memoryStore);
      if (Object.prototype.hasOwnProperty.call(memoryMeta, key)) return clone(memoryMeta[key]);
      return fallback;
    }
    return readJsonLocal(key, fallback);
  }

  function writeJson(key, val) {
    if (useFileDb && key !== SESSION_KEY) {
      if (key === AUTH_KEY) return saveAuthUsers(val);
      if (key === STORE_KEY) return saveStore(val);
      memoryMeta[key] = val;
      fetch("/api/db/meta", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memoryMeta)
      }).catch(e => console.error("meta save failed", e));
      return;
    }
    writeJsonLocal(key, val);
  }
  function unwrap(val) {
    if (val && typeof val === "object" && val.__serverTimestamp) return val.ms;
    return val;
  }
  function stamp(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(stamp);
    const out = {};
    Object.keys(obj).forEach(k => {
      const v = obj[k];
      if (v && typeof v === "object" && v.__serverTimestamp) out[k] = Date.now();
      else if (v && typeof v === "object") out[k] = stamp(v);
      else out[k] = v;
    });
    return out;
  }

  function loadAuthUsers() { return readJson(AUTH_KEY, {}); }
  function saveAuthUsers(users) {
    if (useFileDb) {
      memoryAuth = clone(users);
      return fetch("/api/db/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memoryAuth)
      }).then(r => {
        if (!r.ok) throw new Error("auth save failed");
        return r.json();
      }).then(data => {
        if (data && data.version) remoteDbVersion = data.version;
      });
    }
    writeJsonLocal(AUTH_KEY, users);
    return Promise.resolve();
  }
  function loadStore() { return readJson(STORE_KEY, {}); }
  function putStoreWithRetry(buildStore) {
    const maxAttempts = 8;
    const attempt = (n) => {
      storeWritesInFlight++;
      const baseVersion = remoteDbVersion;
      const next = buildStore();
      memoryStore = clone(next);
      return fetch("/api/db/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseVersion, store: memoryStore })
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (r.status === 409 || data.conflict) {
          if (data.store) memoryStore = clone(data.store);
          if (data.version) remoteDbVersion = data.version;
          if (n + 1 >= maxAttempts) throw new Error("store save conflict");
          return attempt(n + 1);
        }
        if (!r.ok) throw new Error("store save failed");
        if (data.store) memoryStore = clone(data.store);
        if (data.version) remoteDbVersion = data.version;
      }).finally(() => {
        storeWritesInFlight = Math.max(0, storeWritesInFlight - 1);
        if (storeWritesInFlight === 0 && pendingStoreReload) {
          pendingStoreReload = false;
          reloadFromServer();
        }
      });
    };
    return attempt(0);
  }
  function enqueueStoreMutation(mutator) {
    const run = storeWriteChain.then(() =>
      putStoreWithRetry(() => {
        const store = clone(memoryStore);
        mutator(store);
        return store;
      })
    );
    storeWriteChain = run.catch(() => {});
    return run;
  }
  function saveStore(store) {
    if (useFileDb) {
      return enqueueStoreMutation(s => {
        Object.keys(s).forEach(k => { delete s[k]; });
        Object.assign(s, clone(store));
      });
    }
    writeJsonLocal(STORE_KEY, store);
    return Promise.resolve();
  }

  const colListeners = {};
  const docListeners = {};
  function listenKey(col, id) { return col + "/" + id; }
  function notifyCollection(col) {
    const store = loadStore();
    const docs = Object.keys(store[col] || {}).map(id => makeDocSnap(id, store[col][id]));
    (colListeners[col] || []).forEach(fn => {
      try { fn({ docs, empty: !docs.length }); } catch (e) { console.error(e); }
    });
  }
  function notifyDoc(col, id) {
    const store = loadStore();
    const data = (store[col] || {})[id];
    const snap = makeDocSnap(id, data);
    (docListeners[listenKey(col, id)] || []).forEach(fn => {
      try { fn(snap); } catch (e) { console.error(e); }
    });
  }
  function notify(col, id) {
    notifyCollection(col);
    if (id) notifyDoc(col, id);
  }
  function notifyAllCollections() {
    Object.keys(colListeners).forEach(notifyCollection);
    Object.keys(docListeners).forEach(key => {
      const slash = key.indexOf("/");
      if (slash < 0) return;
      notifyDoc(key.slice(0, slash), key.slice(slash + 1));
    });
  }
  if (typeof window !== "undefined") {
    window.addEventListener("storage", e => {
      if (!useFileDb && e.key === STORE_KEY) notifyAllCollections();
    });
  }

  function makeDocSnap(id, data) {
    const exists = data != null;
    return {
      id,
      exists,
      data() { return exists ? clone(data) : undefined; }
    };
  }

  function createAuth(persistSession) {
    let currentUser = null;
    const listeners = [];
    function emit() {
      listeners.forEach(cb => {
        try { cb(currentUser); } catch (e) { console.error(e); }
      });
    }
    function setUser(user, writeSession) {
      currentUser = user;
      if (persistSession && writeSession) {
        if (user) writeJson(SESSION_KEY, { uid: user.uid, email: user.email });
        else localStorage.removeItem(SESSION_KEY);
      }
      emit();
    }
    if (persistSession) {
      const sess = readJson(SESSION_KEY, null);
      if (sess && sess.uid && sess.email) currentUser = { uid: sess.uid, email: sess.email };
    }
    return {
      get currentUser() { return currentUser; },
      onAuthStateChanged(cb) {
        listeners.push(cb);
        Promise.resolve().then(() => cb(currentUser));
        return () => {
          const i = listeners.indexOf(cb);
          if (i >= 0) listeners.splice(i, 1);
        };
      },
      async signInWithEmailAndPassword(email, pass) {
        const key = String(email || "").trim().toLowerCase();
        const users = loadAuthUsers();
        const rec = users[key];
        if (!rec || rec.password !== String(pass)) {
          throw authError("auth/invalid-credential", "Firebase: Error (auth/invalid-credential).");
        }
        const user = { uid: rec.uid, email: rec.email };
        setUser(user, true);
        return { user };
      },
      async createUserWithEmailAndPassword(email, pass) {
        const trimmed = String(email || "").trim();
        const key = trimmed.toLowerCase();
        if (!trimmed || !pass) throw authError("auth/invalid-email", "Email and password are required.");
        if (String(pass).length < 6) throw authError("auth/weak-password", "Password should be at least 6 characters.");
        const users = loadAuthUsers();
        if (users[key]) throw authError("auth/email-already-in-use", "Firebase: Error (auth/email-already-in-use).");
        const uid = STABLE_UIDS[key] || newId();
        users[key] = { uid, email: trimmed, password: String(pass) };
        saveAuthUsers(users);
        const user = { uid, email: trimmed };
        setUser(user, persistSession);
        return { user };
      },
      async signOut() {
        setUser(null, true);
      },
      async sendPasswordResetEmail(email) {
        const key = String(email || "").trim().toLowerCase();
        const users = loadAuthUsers();
        if (!users[key]) return;
        /* Local mode: no email is sent. Admin can set a new password from User Manage. */
      }
    };
  }

  function colMap(store, name) {
    if (!store[name]) store[name] = {};
    return store[name];
  }

  function makeQuery(col, sorts, limitN) {
    function run() {
      const store = loadStore();
      let docs = Object.keys(store[col] || {}).map(id => makeDocSnap(id, store[col][id]));
      (sorts || []).forEach(([field, dir]) => {
        const mul = dir === "asc" ? 1 : -1;
        docs.sort((a, b) => {
          const av = unwrap(a.data()[field]);
          const bv = unwrap(b.data()[field]);
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
          return String(av).localeCompare(String(bv)) * mul;
        });
      });
      if (limitN) docs = docs.slice(0, limitN);
      return { docs, empty: !docs.length };
    }
    const api = {
      orderBy(field, dir) {
        return makeQuery(col, (sorts || []).concat([[field, dir || "asc"]]), limitN);
      },
      limit(n) {
        return makeQuery(col, sorts || [], n);
      },
      async get() { return run(); },
      onSnapshot(cb, errCb) {
        const wrapped = () => {
          try { cb(run()); } catch (e) { if (errCb) errCb(e); }
        };
        if (!colListeners[col]) colListeners[col] = [];
        colListeners[col].push(wrapped);
        Promise.resolve().then(wrapped);
        return () => {
          colListeners[col] = (colListeners[col] || []).filter(fn => fn !== wrapped);
        };
      }
    };
    return api;
  }

  function makeDocRef(col, id) {
    if (!id) id = newId();
    return {
      id,
      async get() {
        const store = loadStore();
        return makeDocSnap(id, (store[col] || {})[id]);
      },
      async set(data, opts) {
        await enqueueStoreMutation(store => {
          const map = colMap(store, col);
          const next = stamp(clone(data));
          if (opts && opts.merge && map[id]) map[id] = Object.assign({}, map[id], next);
          else map[id] = next;
        });
        notify(col, id);
      },
      async update(data) {
        await enqueueStoreMutation(store => {
          const map = colMap(store, col);
          if (!map[id]) throw new Error("No document to update: " + col + "/" + id);
          map[id] = Object.assign({}, map[id], stamp(clone(data)));
        });
        notify(col, id);
      },
      async delete() {
        await enqueueStoreMutation(store => {
          if (store[col]) delete store[col][id];
        });
        notify(col, id);
      },
      onSnapshot(cb, errCb) {
        const wrapped = (snap) => {
          try { cb(snap); } catch (e) { if (errCb) errCb(e); }
        };
        const key = listenKey(col, id);
        if (!docListeners[key]) docListeners[key] = [];
        docListeners[key].push(wrapped);
        Promise.resolve().then(async () => {
          try { wrapped(await makeDocRef(col, id).get()); } catch (e) { if (errCb) errCb(e); }
        });
        return () => {
          docListeners[key] = (docListeners[key] || []).filter(fn => fn !== wrapped);
        };
      }
    };
  }

  function makeCollection(col) {
    const q = makeQuery(col, [], null);
    return {
      doc(id) { return makeDocRef(col, id); },
      async add(data) {
        const ref = makeDocRef(col, newId());
        await ref.set(data);
        return ref;
      },
      async get() { return q.get(); },
      orderBy(field, dir) { return q.orderBy(field, dir); },
      limit(n) { return q.limit(n); },
      onSnapshot(cb, errCb) { return q.onSnapshot(cb, errCb); }
    };
  }

  const dbApi = {
    collection(name) { return makeCollection(name); },
    batch() {
      const ops = [];
      return {
        set(ref, data) { ops.push(() => ref.set(data)); },
        update(ref, data) { ops.push(() => ref.update(data)); },
        delete(ref) { ops.push(() => ref.delete()); },
        async commit() {
          for (const op of ops) await op();
        }
      };
    }
  };

  const apps = {};
  function makeApp(persistSession) {
    const authInst = createAuth(persistSession);
    return { auth() { return authInst; } };
  }

  const firebase = {
    initializeApp(config, name) {
      const n = name || "[DEFAULT]";
      if (!apps[n]) apps[n] = makeApp(n === "[DEFAULT]");
      return apps[n];
    },
    auth() { return this.initializeApp({}).auth(); },
    firestore() { return dbApi; }
  };
  firebase.firestore.FieldValue = {
    serverTimestamp() { return { __serverTimestamp: true, ms: Date.now() }; }
  };
  firebase.localAuth = {
    getByUid(uid) {
      if (!uid) return null;
      const users = loadAuthUsers();
      const key = Object.keys(users).find(k => users[k].uid === uid);
      if (!key) return null;
      return { uid: users[key].uid, email: users[key].email, password: users[key].password };
    },
    setPasswordByUid(uid, password) {
      const pass = String(password || "");
      if (pass.length < 6) throw authError("auth/weak-password", "Password should be at least 6 characters.");
      const users = loadAuthUsers();
      const key = Object.keys(users).find(k => users[k].uid === uid);
      if (!key) throw authError("auth/user-not-found", "No login exists for this user.");
      users[key].password = pass;
      saveAuthUsers(users);
    },
    setPasswordByEmail(email, password) {
      const pass = String(password || "");
      if (pass.length < 6) throw authError("auth/weak-password", "Password should be at least 6 characters.");
      const users = loadAuthUsers();
      const key = String(email || "").trim().toLowerCase();
      if (!users[key]) return false;
      users[key].password = pass;
      saveAuthUsers(users);
      return true;
    },
    deleteByUid(uid) {
      const users = loadAuthUsers();
      let changed = false;
      Object.keys(users).forEach(k => {
        if (users[k].uid === uid) { delete users[k]; changed = true; }
      });
      if (changed) saveAuthUsers(users);
    }
  };

  function ensureAuth(email, password, preferredUid) {
    const users = loadAuthUsers();
    const key = String(email).trim().toLowerCase();
    if (users[key] && users[key].uid) return users[key].uid;
    const uid = STABLE_UIDS[key] || preferredUid || newId();
    users[key] = { uid, email: String(email).trim(), password: String(password) };
    saveAuthUsers(users);
    return uid;
  }

  function migrateStore() {
    const done = readJson(STORE_MIGRATION_KEY, 0);
    if (done >= STORE_MIGRATION_VERSION) return;
    const store = loadStore();
    const sampleGigs = {
      tag_web: ["React", "Next.js", "WordPress", "Shopify", "Laravel"],
      tag_mobile: ["Flutter", "React Native", "iOS", "Android"],
      tag_seo: ["On-page SEO", "Technical SEO", "Link Building"],
      tag_uiux: ["Figma", "Landing Page", "Dashboard UI"],
      tag_wp: ["Theme Dev", "Plugin Dev", "WooCommerce"]
    };
    let changed = false;
    Object.keys(store.profiles || {}).forEach(id => {
      const p = store.profiles[id];
      if (!Array.isArray(p.gigNames)) {
        p.gigNames = sampleGigs[id] ? sampleGigs[id].slice() : [];
        changed = true;
      }
    });
    if (changed) saveStore(store);
    writeJson(STORE_MIGRATION_KEY, STORE_MIGRATION_VERSION);
    if (changed) notifyAllCollections();
  }

  function seedDummyData() {
    if (readJson(DUMMY_SEED_KEY, null) === DUMMY_SEED_VERSION) return;

    const uidAdmin = ensureAuth("mdabdulquiyumbadol@gmail.com", "1234567", STABLE_UIDS["mdabdulquiyumbadol@gmail.com"]);
    const uidSanaul = ensureAuth("sanaul.doptortech@gmail.com", "12345678", STABLE_UIDS["sanaul.doptortech@gmail.com"]);
    const uidRafiq = ensureAuth("rafiq.pm@doptortech.com", "12345678", STABLE_UIDS["rafiq.pm@doptortech.com"]);
    const uidNabila = ensureAuth("nabila.lead@doptortech.com", "12345678", STABLE_UIDS["nabila.lead@doptortech.com"]);
    const uidTanvir = ensureAuth("tanvir.dev@doptortech.com", "12345678", STABLE_UIDS["tanvir.dev@doptortech.com"]);
    const uidFarhana = ensureAuth("farhana.dev@doptortech.com", "12345678", STABLE_UIDS["farhana.dev@doptortech.com"]);
    const uidImran = ensureAuth("imran.free@doptortech.com", "12345678", STABLE_UIDS["imran.free@doptortech.com"]);
    const uidAntu = ensureAuth("antu.doptortech@gmail.com", "1234567", STABLE_UIDS["antu.doptortech@gmail.com"]);
    const uidProtik = ensureAuth("protik.doptortech@gmail.com", "1234567", STABLE_UIDS["protik.doptortech@gmail.com"]);
    const uidTauhid = ensureAuth("tauhid.doptortech@gmail.com", "1234567", STABLE_UIDS["tauhid.doptortech@gmail.com"]);
    const uidAdib = ensureAuth("adib.doptortech@gmail.com", "1234567", STABLE_UIDS["adib.doptortech@gmail.com"]);
    const uidBadol = ensureAuth("badol.doptortech@gmail.com", "1234567", STABLE_UIDS["badol.doptortech@gmail.com"]);

    const store = loadStore();
    function put(col, id, doc) {
      if (!store[col]) store[col] = {};
      if (!store[col][id]) store[col][id] = doc;
    }

    put("users", uidAdmin, {
      name: "Admin", role: "Admin", team: "", workHours: "10am–8pm GMT+6", timezone: "GMT+6",
      contact: "mdabdulquiyumbadol@gmail.com", active: true, profiles: []
    });
    put("users", uidSanaul, {
      name: "Sanaul", role: "Admin", team: "Leadership", workHours: "10am–7pm GMT+6", timezone: "GMT+6",
      contact: "sanaul.doptortech@gmail.com", active: true, profiles: []
    });
    put("users", uidRafiq, {
      name: "Rafiq Hasan", role: "Project Manager", team: "Delivery", workHours: "9am–6pm GMT+6", timezone: "GMT+6",
      contact: "rafiq.pm@doptortech.com", active: true, profiles: ["Web", "Mobile"]
    });
    put("users", uidNabila, {
      name: "Nabila Rahman", role: "Team Lead", team: "Team Alpha", workHours: "10am–7pm GMT+6", timezone: "GMT+6",
      contact: "nabila.lead@doptortech.com", active: true, profiles: ["Web", "WordPress"]
    });
    put("users", uidTanvir, {
      name: "Tanvir Ahmed", role: "Developer", team: "Team Alpha", workHours: "10am–7pm GMT+6", timezone: "GMT+6",
      contact: "tanvir.dev@doptortech.com", active: true, profiles: ["Web", "WordPress"], monthlyDeliveryTarget: 4
    });
    put("users", uidFarhana, {
      name: "Farhana Islam", role: "Developer", team: "Team Alpha", workHours: "11am–8pm GMT+6", timezone: "GMT+6",
      contact: "farhana.dev@doptortech.com", active: true, profiles: ["Mobile", "UI/UX"], monthlyDeliveryTarget: 3
    });
    put("users", uidImran, {
      name: "Imran Hossain", role: "Freelancer", team: "External", workHours: "flexible GMT+6", timezone: "GMT+6",
      contact: "imran.free@doptortech.com", active: true, profiles: ["SEO", "WordPress"], monthlyDeliveryTarget: 2
    });
    put("users", uidAntu, {
      name: "Antu", role: "Sales", team: "Sales", workHours: "10am–8pm GMT+6", timezone: "GMT+6",
      contact: "antu.doptortech@gmail.com", active: true, profiles: [], monthlyTarget: 8000
    });
    put("users", uidProtik, {
      name: "Protik", role: "Sales", team: "Sales", workHours: "10am–8pm GMT+6", timezone: "GMT+6",
      contact: "protik.doptortech@gmail.com", active: true, profiles: [], monthlyTarget: 10000
    });
    put("users", uidTauhid, {
      name: "Tauhid", role: "Sales", team: "Sales", workHours: "11am–8pm GMT+6", timezone: "GMT+6",
      contact: "tauhid.doptortech@gmail.com", active: true, profiles: [], monthlyTarget: 6000
    });
    put("users", uidAdib, {
      name: "Adib", role: "Sales", team: "Sales", workHours: "10am–7pm GMT+6", timezone: "GMT+6",
      contact: "adib.doptortech@gmail.com", active: true, profiles: [], monthlyTarget: 7000
    });
    put("users", uidBadol, {
      name: "Badol", role: "Sales", team: "Sales", workHours: "12pm–9pm GMT+6", timezone: "GMT+6",
      contact: "badol.doptortech@gmail.com", active: true, profiles: [], monthlyTarget: 8000
    });

    if (!store.profiles || !Object.keys(store.profiles).length) {
      store.profiles = {
        tag_web: { name: "Web Development", gigNames: ["React", "Next.js", "WordPress", "Shopify", "Laravel"] },
        tag_mobile: { name: "Mobile App", gigNames: ["Flutter", "React Native", "iOS", "Android"] },
        tag_seo: { name: "SEO", gigNames: ["On-page SEO", "Technical SEO", "Link Building"] },
        tag_uiux: { name: "UI/UX Design", gigNames: ["Figma", "Landing Page", "Dashboard UI"] },
        tag_wp: { name: "WordPress", gigNames: ["Theme Dev", "Plugin Dev", "WooCommerce"] }
      };
    }
    if (!store.stages || !Object.keys(store.stages).length) {
      store.stages = {
        stg_discovery: { name: "Discovery", isDelivery: false },
        stg_design: { name: "Design", isDelivery: false },
        stg_dev: { name: "Development", isDelivery: false },
        stg_qa: { name: "QA", isDelivery: false },
        stg_delivered: { name: "Delivered", isDelivery: true }
      };
    }
    if (!store.statuses || !Object.keys(store.statuses).length) {
      store.statuses = {
        sts_ns: { name: "Not Started", isDelivery: false, isDelayed: false },
        sts_ip: { name: "In Progress", isDelivery: false, isDelayed: false },
        sts_wait: { name: "Waiting on Client", isDelivery: false, isDelayed: true },
        sts_rev: { name: "In Review", isDelivery: false, isDelayed: false },
        sts_done: { name: "Completed", isDelivery: true, isDelayed: false },
        sts_hold: { name: "On Hold", isDelivery: false, isDelayed: true }
      };
    }
    if (!store.settings) store.settings = {};
    const curSet = store.settings.company || {};
    if (!curSet.salesTarget && !curSet.deliveryTarget) {
      store.settings.company = { salesTarget: 35000, deliveryTarget: 8 };
    }

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
      projectId: "prj_novatech", date: "2026-08-15", addedBy: uidAntu,
      content: "Client wants a case-study section on the homepage, not a separate page."
    });
    put("clientNotes", "note_02", {
      projectId: "prj_orbit", date: "2026-08-19", addedBy: uidProtik,
      content: "Must support Bangla + English in the dealer portal from day one."
    });
    put("clientNotes", "note_03", {
      projectId: "prj_greenleaf", date: "2026-08-20", addedBy: uidTauhid,
      content: "Owner travelling until 5 Sep — delayed credentials until then."
    });
    put("clientNotes", "note_04", {
      projectId: "prj_harbor", date: "2026-08-12", addedBy: uidBadol,
      content: "Paused until they confirm the new logo. Do not publish current draft."
    });
    put("clientNotes", "note_05", {
      projectId: "prj_kidslearn", date: "2026-08-26", addedBy: uidAdib,
      content: "Kickoff next week. They will share Figma + API docs on Monday."
    });

    saveStore(store);
    writeJson(DUMMY_SEED_KEY, DUMMY_SEED_VERSION);
  }

  bootstrapFromServer();
  seedDummyData();
  migrateStore();

  root.firebase = firebase;
  root.firebaseDbMode = useFileDb ? "file" : "browser";
})(window);
