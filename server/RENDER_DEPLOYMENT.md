# Render: backend deployment and MongoDB Atlas recovery

The backend deliberately does **not** accept API requests until MongoDB connects. A missing Atlas SRV record is a configuration/DNS failure, not a successful application deployment.

## When logs show `querySrv ENOTFOUND`

1. In MongoDB Atlas, open **Database > Clusters** and confirm the intended cluster is **Active**. Paused or deleted clusters can lose their DNS records.
2. Select **Connect > Drivers** for that cluster and copy its **current connection string**. Use the exact `*.mongodb.net` hostname. Replace the username/password placeholders with your database-user credentials and percent-encode reserved characters in the password.
3. In **Render > DevFolio backend service > Environment**, replace `MONGODB_URI` with the current URI. Do **not** paste credentials into GitHub, logs, issues, or chat. Check `JWT_SECRET`, `JWT_REFRESH_SECRET` and `CLIENT_URL` too.
4. Redeploy the service, then request `GET /api/health`. Do not consider deployment healthy until the database connection succeeds and the API responds.
5. If the **correct** Atlas hostname still cannot be resolved, check its DNS SRV record from the affected environment (for example, `nslookup -type=SRV _mongodb._tcp.<host>`). Use the standard, non-SRV `mongodb://` URI offered by Atlas **instead of manually inventing hostnames** if SRV resolution is not supported.
6. If DNS works but the database still cannot connect, inspect Atlas **Network Access**, database-user credentials, and outbound port 27017 connectivity. IP allowlisting is separate from DNS.

## Recommended Render service configuration

- **Root Directory:** `server`
- **Build Command:** `npm ci --omit=dev` (reproducible install from `package-lock.json`)
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`
- **Runtime:** Node.js 22, as supported by the current dependency set

`REDIS_URL` is optional: its absence disables caching and is not the cause of MongoDB SRV lookup failure. The nightly scheduler and sync worker now start only after MongoDB connects.

## Security follow-up

The lockfile upgrades DOMPurify from 3.3.3 to 3.4.17 to address published sanitizer vulnerabilities. **This is not proof that all npm audit findings are resolved.** Run `npm audit --omit=dev` in `server/`, review the advisory paths, apply compatible fixes, then run `npm test` and `npm run test:startup` before further dependency upgrades.
