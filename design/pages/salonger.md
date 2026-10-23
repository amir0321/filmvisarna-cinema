> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.3 Badges, 3.4 Kort, 3.10 MiniAuditoriumMap), [design/layout.md](../layout.md) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.6 Våra Salonger (`SalongerScreen`)

- **Föreslagen route:** `/salonger` (Föreslagen)
- **Skärm-ID:** `'salonger'`
- **Källfil:** `src/components/SalongerScreen.tsx`

#### Struktur uppifrån och ned
1. **Sidhuvud (`background: linear-gradient(135deg, #0B0F19 0%, #161F30 50%, #0B0F19 100%)`, `border-bottom: 1px solid var(--border)`):**
   - Subtilt bakgrundsrutnät (`40×40px`, `opacity: 0.05`, vita `1px`-linjer).
   - Container (`max-width: 1280px`, `padding: 112px 20px 56px`):
     - Röd pill-badge: `Filmvisarna Småstad` (`12px`, `uppercase`, `letter-spacing: 0.1em`, bakgrund `rgba(229, 9, 20, 0.15)`, text `#E50914`).
     - **Rubrik (`h1`):** `Våra Salonger` (`36px` mobil / `48px` desktop, `Poppins`, `font-weight: 700`).
     - **Ingress:** `Två salonger med det bästa i ljud och bild — oavsett om du söker storslaget eller intimt.` (`16px`, `#94A3B8`, `max-width: 576px`).
2. **Salongskort-grid (`max-width: 1280px`, `padding: 48px 20px`, 1 kolumn på `< 1024px`, 2 kolumner `lg:grid-cols-2` på `>= 1024px`, `gap: 32px`):**
   - Två salongskort i `#161F30` (`border-radius: 16px`, `border: 1px solid var(--border)`).
   - **Exempeldata i `SALONGER`:**
     - **Salong 1:**
       - Namn: `Salong 1`, Undertitel: `Stora Salongen`, Färg: `#E50914`
       - Badges nere till vänster på bilden (`aspect-video`): `80 platser` (bakgrund `#E50914`), `4K Laser` (`.glass`), `Dolby Atmos` (`.glass`).
       - Badge uppe till höger på bilden: `Premiärsalong` (`rgba(0, 0, 0, 0.6)`).
       - Tillgänglighetsbadge till höger om rubriken: `Tillgänglig` (blå rullstolsikon + text `#3B82F6`, bakgrund `rgba(59, 130, 246, 0.12)`).
       - Punktlista med röda bockikoner (`#E50914`):
         - `4K Laser Projektor`
         - `Dolby Atmos Ljud`
         - `Bred duk (18m)`
         - `Rullstolsplatser (rad A)`
         - `Barservering tillgänglig`
       - Minikarta (`MiniAuditoriumMap`): Rubrik `Salongskarta` (`12px`, `uppercase`), `BIODUK`, 10 rader × 8 stolar, legend: `Ledig`, `Exempelval`, `Rullstol`.
     - **Salong 2:**
       - Namn: `Salong 2`, Undertitel: `Lilla Salongen`, Färg: `#10B981`
       - Badges nere till vänster på bilden: `40 platser` (bakgrund `#10B981`), `2D` (`.glass`), `Stereo` (`.glass`).
       - Badge uppe till höger på bilden: `Bekväma fåtöljer`.
       - Tillgänglighetsbadge: `Tillgänglig` (`#3B82F6`).
       - Punktlista med gröna bockikoner (`#10B981`):
         - `2D Digital Projektor`
         - `Premium Fåtöljer`
         - `Intim atmosfär`
         - `Rullstolsplatser (rad A)`
         - `Familjevänlig`
       - Minikarta (`MiniAuditoriumMap`): Rubrik `Salongskarta`, `BIODUK`, 5 rader × 8 stolar, legend: `Ledig`, `Exempelval`, `Rullstol`.
   - **CTA-knapp längst ned i varje salongskort:** `Se schema →` (primär röd knapp, `width: 100%`, navigerar till `'home'`).
3. **Informationsruta längst ned (`#161F30`, `border-radius: 16px`, `padding: 32px`, 1 kolumn på `< 768px`, 2 kolumner `md:grid-cols-2` på `>= 768px`, `gap: 32px`):**
   - **Vänster kolumn:**
     - Rubrik (`h3`): `Tillgänglighet & Rullstolsplatser` (`20px`, `Poppins`, `font-weight: 700`).
     - Brödtext: `Båda salongerna är fullt tillgängliga för besökare med rörelsehinder. Rullstolsplatser finns i den första raden (Rad A) vid sidan av salongen, med fri sikt till duken.`
     - Punktlista (med blå cirkelprickar `6×6px`, `#3B82F6`):
       - `Bred ingång utan tröskel`
       - `Ramp till alla salonger`
       - `Tillgängliga toaletter i foajén`
       - `Induktionsslinga för hörselhjälpmedel`
   - **Höger kolumn:**
     - Rubrik (`h3`): `Dukens placering` (`20px`, `Poppins`, `font-weight: 700`).
     - Brödtext: `Båda salongerna har trappande sittning för fri sikt. Duken är placerad centralt med optimalt siktavstånd från alla platser.`
     - 2×2 faktarutor (`border-radius: 12px`, `padding: 12px`, `background: rgba(255, 255, 255, 0.04)`):
       - `Stora salongen` / `18 × 8 m duk`
       - `Lilla salongen` / `10 × 4,5 m duk`
       - `Optimal sittrad` / `Rad D–G`
       - `Öppningsår` / `1987 / 2019`

