#!/usr/bin/env node
/**
 * À lancer UNE SEULE FOIS, sur votre ordinateur, pour obtenir le jeton
 * (refresh token) qui permet à GitHub de lire les avis Google chaque jour.
 *
 * Usage :
 *   GBP_CLIENT_ID=xxx GBP_CLIENT_SECRET=yyy node scripts/reviews/get-refresh-token.mjs
 *
 * Le navigateur s'ouvre (ou copiez le lien affiché), connectez-vous avec le
 * compte Google propriétaire OU gestionnaire de la fiche « Elise BUIL », acceptez, puis copiez
 * le jeton affiché dans le secret GitHub GBP_REFRESH_TOKEN.
 */
import http from "node:http";
import { exec } from "node:child_process";
import { randomBytes } from "node:crypto";

const CLIENT_ID = process.env.GBP_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GBP_CLIENT_SECRET?.trim();
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Définissez GBP_CLIENT_ID et GBP_CLIENT_SECRET (identifiant OAuth de type « Application de bureau »).");
  process.exit(1);
}

const SCOPE = "https://www.googleapis.com/auth/business.manage";
const state = randomBytes(16).toString("hex");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== "/") {
    res.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error || !code || url.searchParams.get("state") !== state) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" }).end(`Échec : ${error ?? "réponse invalide"}`);
    console.error(`\n❌ Autorisation refusée ou invalide : ${error ?? "state/code manquant"}`);
    server.close();
    process.exitCode = 1;
    return;
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const body = await tokenRes.json();
  if (!body.refresh_token) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }).end("Pas de refresh token reçu, voir le terminal.");
    console.error("\n❌ Aucun refresh token reçu :", body);
    server.close();
    process.exitCode = 1;
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(
    "<h2>✅ C'est bon ! Vous pouvez fermer cet onglet et revenir au terminal.</h2>",
  );
  console.log("\n✅ Jeton obtenu. Copiez la ligne ci-dessous dans le secret GitHub GBP_REFRESH_TOKEN :\n");
  console.log(body.refresh_token);
  console.log("\n(Ne le partagez avec personne : il donne accès à la fiche Google.)");
  server.close();
});

let redirectUri = "";
server.listen(0, "127.0.0.1", () => {
  redirectUri = `http://127.0.0.1:${server.address().port}`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.search = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();

  console.log("Ouvrez ce lien et connectez-vous avec le compte propriétaire ou gestionnaire de la fiche Google :\n");
  console.log(authUrl.toString());
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start \"\"" : "xdg-open";
  exec(`${opener} "${authUrl.toString()}"`, () => {});
});
