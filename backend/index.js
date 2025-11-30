// server.js
const Koa = require("koa");
const app = new Koa();
const server = require("http").createServer(app.callback());
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
const Router = require("koa-router");
const cors = require("koa-cors");
const bodyparser = require("koa-bodyparser");

app.use(bodyparser());
app.use(cors());
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} ${ctx.response.status} - ${ms}ms`);
});

// artificial delay (poți scoate la final)
app.use(async (ctx, next) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await next();
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body = { message: err.message || "Unexpected error" };
    ctx.response.status = 500;
  }
});

/**
 * Masina domain
 * id: string
 * marca: string
 * model: string
 * an: number
 * culoare: string
 * nrInmatriculare: string
 * date (timestamp)
 * version: number (optimistic concurrency)
 */
class Masina {
  constructor({
    id,
    marca,
    model,
    an,
    culoare,
    nrInmatriculare,
    date,
    version,
  }) {
    this.id = id;
    this.marca = marca;
    this.model = model;
    this.an = an;
    this.culoare = culoare;
    this.nrInmatriculare = nrInmatriculare;
    this.date = date;
    this.version = version;
  }
}

const masini = [];
for (let i = 0; i < 3; i++) {
  masini.push(
    new Masina({
      id: `${i}`,
      marca: `Marca${i}`,
      model: `Model${i}`,
      an: 2015 + i,
      culoare: ["rosu", "albastru", "negru"][i % 3],
      nrInmatriculare: `CJ-0${i}ABC`,
      date: new Date(Date.now() + i),
      version: 1,
    })
  );
}
let lastUpdated = masini[masini.length - 1].date;
let lastId = masini[masini.length - 1].id;
const pageSize = 10;

const broadcast = (data) =>
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });

const router = new Router();

/**
 * GET /masini
 * - returnează lista completă (poți adăuga paginare/filtre)
 */
router.get("/masini", (ctx) => {
  ctx.response.body = masini;
  ctx.response.status = 200;
});

/**
 * GET /masini/:id
 */
router.get("/masini/:id", async (ctx) => {
  const masinaId = ctx.request.params.id;
  const masina = masini.find((m) => masinaId === m.id);
  if (masina) {
    ctx.response.body = masina;
    ctx.response.status = 200;
  } else {
    ctx.response.body = { message: `masina with id ${masinaId} not found` };
    ctx.response.status = 404;
  }
});

/**
 * validation helper
 */
const validateMasina = (m) => {
  if (!m.marca || !m.model)
    return { ok: false, message: "Marca or model missing" };
  if (!m.nrInmatriculare)
    return { ok: false, message: "Nr inmatriculare missing" };
  // opțional: regex pe nrInmatriculare
  return { ok: true };
};

/**
 * createMasina (used by POST and PUT when missing id)
 */
const createMasina = async (ctx) => {
  const m = ctx.request.body;
  const v = validateMasina(m);
  if (!v.ok) {
    ctx.response.body = { message: v.message };
    ctx.response.status = 400;
    return;
  }
  m.id = `${parseInt(lastId) + 1}`;
  lastId = m.id;
  m.date = new Date();
  m.version = 1;
  masini.push(m);
  ctx.response.body = m;
  ctx.response.status = 201;
  broadcast({ event: "created", payload: { item: m } }); // CHANGED
};

router.post("/masini", async (ctx) => {
  await createMasina(ctx);
});

/**
 * PUT /masini/:id
 * - dacă body nu are id -> creează
 * - dacă există -> update cu verificare version (ETag header)
 */
router.put("/masini/:id", async (ctx) => {
  const id = ctx.params.id;
  const m = ctx.request.body;
  m.date = new Date();
  const bodyId = m.id;
  if (bodyId && id !== m.id) {
    ctx.response.body = { message: `Param id and body id should be the same` };
    ctx.response.status = 400;
    return;
  }
  if (!bodyId) {
    await createMasina(ctx);
    return;
  }
  const index = masini.findIndex((x) => x.id === id);
  if (index === -1) {
    ctx.response.body = { message: `masina with id ${id} not found` };
    ctx.response.status = 400;
    return;
  }
  const itemVersion = parseInt(ctx.request.get("ETag")) || m.version || 0;
  if (itemVersion < masini[index].version) {
    ctx.response.body = { message: `Version conflict` };
    ctx.response.status = 409;
    return;
  }
  m.version = (m.version || masini[index].version) + 1;
  masini[index] = m;
  lastUpdated = new Date();
  ctx.response.body = m;
  ctx.response.status = 200;
  broadcast({ event: "updated", payload: { item: m } }); // CHANGED
});

/**
 * DELETE /masini/:id
 */
router.del("/masini/:id", (ctx) => {
  const id = ctx.params.id;
  const index = masini.findIndex((m) => id === m.id);
  if (index !== -1) {
    const masina = masini[index];
    masini.splice(index, 1);
    lastUpdated = new Date();
    broadcast({ event: "deleted", payload: { item: masina } }); // CHANGED
  }
  ctx.response.status = 204;
});

/**
 * periodic generator: adaugă o masina nouă la fiecare 5s
 * (utile pentru demo WS)
 
setInterval(() => {
  lastUpdated = new Date();
  lastId = `${parseInt(lastId) + 1}`;
  const masina = new Masina({
    id: lastId,
    marca: `Marca${lastId}`,
    model: `Model${lastId}`,
    an: 2020,
    culoare: 'gri',
    nrInmatriculare: `CJ-${lastId}ZZZ`,
    date: lastUpdated,
    version: 1
  });
  masini.push(masina);
  console.log(`New masina: ${masina.marca} ${masina.model} (${masina.id})`);
  broadcast({ event: 'created', payload: { item: masina } });  // CHANGED
}, 105000);
*/

app.use(router.routes());
app.use(router.allowedMethods());

server.listen(3000, () =>
  console.log("Server listening on http://localhost:3000")
);
