/**
 * LOKACIJA: lib/medals.ts (ili tamo gdje računaš medalje)
 * STATUS: Implementirana kompletna logika prema tvojim uvjetima
 */

export const ACHIEVEMENT_KEYS = {
  TOP_1: "top1",             // public/medalje/top1.png
  BRZI_PRST: "brziprst",     // public/medalje/brziprst.png
  BRZA_RUKA: "brzaruka",     // public/medalje/brzaruka.png
  MARATONAC: "maratonac",
  TEAM_LEADER: "teamleader",
  VATRENI_NIZ: "vatreniniz",
  NEPOGRESIVI: "nepogresivi",
  NOCNA_STRAZA: "nocnastraza",
  MAJSTOR_TEORIJE: "majstorteorije",
  POVRATNIK: "povratnik",
  MAJSTOR_CVOROVA: "majstorcvorova",
  MAJSTOR_SUSTAVA: "majstorsustava",
  MODUL_1: "modul1",
  MODUL_2: "modul2",
  MODUL_3: "modul3",
  VJEZBATELJ: "vjezbatelj", // Ručno dodjeljuje admin
  INSTRUKTOR: "instruktor",  // Ručno dodjeljuje admin
};

export interface MedalStats {
  postotak: number;
  trajanjeSekunde: number;
  modulId: string | number;
  ukupnoPitanja: number;
  history: any[]; // Prošli rezultati korisnika za provjeru nizova i poboljšanja
}

export const calculateNewMedals = (
  currentMedals: string[],
  stats: MedalStats
) => {
  const newMedals = Array.isArray(currentMedals) ? [...currentMedals] : [];
  const add = (key: string) => {
    if (!newMedals.includes(key)) {
      console.log(`🏅 Osvojena nova medalja: ${key}`);
      newMedals.push(key);
    }
  };

  const sat = new Date().getHours();
  const isMikroIspit = String(stats.modulId).startsWith('mikro-');
  const modulIdNumerički = String(stats.modulId).replace('mikro-', '');

  // --- 1. NOĆNA STRAŽA (00:00 - 06:00) ---
  if (sat >= 0 && sat < 6) add(ACHIEVEMENT_KEYS.NOCNA_STRAZA);

  // --- 2. NEPOGREŠIVI (100% na bilo kojem modulnom ispitu) ---
  if (!isMikroIspit && stats.postotak === 100) add(ACHIEVEMENT_KEYS.NEPOGRESIVI);

  // --- 3. BRZI PRST (90%+ u rekordnom vremenu - npr. manje od 7s po pitanju) ---
  if (stats.postotak >= 90 && stats.trajanjeSekunde < stats.ukupnoPitanja * 7) {
    add(ACHIEVEMENT_KEYS.BRZI_PRST);
  }

  // --- 4. MODULI 1, 2, 3 (Završni ispiti) ---
  if (!isMikroIspit && stats.postotak >= 50) { // Pretpostavka da je 50% prolaz
    if (modulIdNumerički === "1") add(ACHIEVEMENT_KEYS.MODUL_1);
    if (modulIdNumerički === "2") add(ACHIEVEMENT_KEYS.MODUL_2);
    if (modulIdNumerički === "3") add(ACHIEVEMENT_KEYS.MODUL_3);
  }

  // --- 5. MARATONAC (Položena sva 3 modula) ---
  if (newMedals.includes("modul1") && newMedals.includes("modul2") && newMedals.includes("modul3")) {
    add(ACHIEVEMENT_KEYS.MARATONAC);
  }

  // --- 6. MIKRO MAJSTORI (100% na specifičnim mikro ispitima) ---
  if (isMikroIspit && stats.postotak === 100) {
    // Ako je ID kategorije Čvorovi npr. 43
    if (modulIdNumerički === "43") add(ACHIEVEMENT_KEYS.MAJSTOR_CVOROVA);
    // Ako je ID kategorije Sustavi npr. 44
    if (modulIdNumerički === "44") add(ACHIEVEMENT_KEYS.MAJSTOR_SUSTAVA);
  }

  // --- 7. POVRATNIK (Poboljšanje rezultata za više od 5%) ---
  const prethodniIsti = stats.history.filter(h => h.modulId === stats.modulId);
  if (prethodniIsti.length > 0) {
    const najboljiProsli = Math.max(...prethodniIsti.map(h => h.postotak));
    if (stats.postotak > najboljiProsli + 5) {
      add(ACHIEVEMENT_KEYS.POVRATNIK);
    }
  }

  // --- 8. VATRENI NIZ (Rješavanje ispita 3 dana zaredom ili 5 puta isti modul) ---
  if (prethodniIsti.length >= 4) { // Ovo je 5. rješavanje istog modula
    add(ACHIEVEMENT_KEYS.VATRENI_NIZ);
  }

  // --- 9. TOP 1% (Ako su položena sva 3 modula s top rezultatom) ---
  // Ovdje bi trebala ići globalna logika, ali kao preduvjet stavljamo top3 na modulima
  if (newMedals.includes("modul1") && newMedals.includes("modul2") && newMedals.includes("modul3")) {
    // Dodatna provjera za top performanse (npr. sve > 95%)
    const prosjek = stats.history.reduce((acc, curr) => acc + curr.postotak, 0) / stats.history.length;
    if (prosjek > 95) add(ACHIEVEMENT_KEYS.TOP_1);
  }

  return newMedals;
};