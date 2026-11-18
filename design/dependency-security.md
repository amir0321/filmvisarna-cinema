# Säkerhetsstatus för frontendens beroenden

Kontrollerad 18 november 2026. Resultaten gäller den incheckade låsfilen och kan ändras när nya säkerhetsrapporter publiceras.

## Uppdateringen

Vite uppdateras från 8.3.0 till 8.3.8, ESLint från 10.10.0 till 10.15.0 och typescript-eslint från 8.70.0 till 8.73.0. Minimikraven i `Frontend/package.json` höjs till dessa versioner. Låsfilen uppdaterar även bland annat minimatch, source-map-js och lintverktygens Zod-beroende till rättade versioner. Produktionsberoendena behåller sina versioner.

Verifierat med en ren `npm ci`, frontendens 47 tester, lint och rotens bygge. Frontendens JavaScript och CSS summerar till 301,06 kB med gzip, under projektets gräns på 500 kB.

## Kvarvarande rapport

- Före uppdateringen: 16 berörda paket (8 moderate, 8 high).
- Efter uppdateringen: 12 berörda paket, alla high, från en enda kvarvarande advisory i `picomatch`.
- `npm audit --prefix Frontend --omit=dev`: 0 rapporterade sårbarheter.

[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) gäller ReDoS vid upprepade extglob-mönster. Alla publicerade versioner till och med 4.0.7 berörs. Vid kontrollen är 4.0.7 den senaste publicerade versionen och advisorn anger ingen rättad version.

De tolv träffarna omfattar `picomatch` och bygg-/lintpaket som beror på det. Antalet träffar beskriver beroendekedjan och ska inte tolkas som tolv separata grundfel. Att antalet high-träffar har ökat från åtta till tolv beror på den uppdaterade kedjan; den kvarvarande grundorsaken är samma advisory.

Node-servern startas med `Backend/dist/server.js` och serverar den byggda frontenden. Vites utvecklingsserver körs inte i produktion. Byggverktygen används fortfarande lokalt, i CI och vid bygge på VPS:en, så det kvarvarande felet behöver följas upp.

`npm audit fix --force` föreslår Vite 6.2.7, en nedgradering från Vite 8 som är inkompatibel med den nuvarande React-pluginens peer-krav. Den lösningen används därför inte. Rapporten döljs inte med undantag eller genom att ta bort utvecklingsberoenden ur standardkontrollen.

## Uppföljning

När en rättad `picomatch`-version publiceras: uppdatera berörda beroenden/låsfil och kör kontrollerna igen. Om de överordnade paketen inte accepterar den rättade versionen behöver deras uppdateringar inväntas eller en kompatibel override utvärderas med tester.

```bash
npm ci --prefix Frontend
npm audit --prefix Frontend
npm audit --prefix Frontend --omit=dev
npm test --prefix Frontend
npm run lint --prefix Frontend
npm run build
```

Gör beroendeändringarna i Git-repot, testa dem och släpp dem genom `develop` och `main`. På VPS:en används därefter projektets vanliga uppdateringsrutin med `npm run setup`, bygge och pm2-omstart.
