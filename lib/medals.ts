export const ACHIEVEMENT_KEYS = {
  TOP_1: "top1",
  BRZI_PRST: "brziprst",
  BRZA_RUKA: "brzaruka",
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
  VJEZBATELJ: "vjezbatelj",
  INSTRUKTOR: "instruktor",
};

export interface MedalStats {
  postotak: number;
  trajanjeSekunde: number;
  modulId: string | number;
  ukupnoPitanja: number;
  history: any[];
  nazivKategorije?: string;
}

export const calculateNewMedals = (currentMedals: string[], stats: MedalStats) => {
  const newMedals: string[] = [];
  const existingMedals = Array.isArray(currentMedals) ? currentMedals : [];
  
  const add = (key: string) => {
    if (!existingMedals.includes(key) && !newMedals.includes(key)) {
      newMedals.push(key);
    }
  };

  const sat = new Date().getHours();
  const isMikroIspit = String(stats.modulId).startsWith('mikro-');
  const modulIdNumerički = String(stats.modulId).replace('mikro-', '');
  const naziv = (stats.nazivKategorije || "").toLowerCase();

  // 1. Noćna straža (00:00 - 06:00)
  if (sat >= 0 && sat < 6) add(ACHIEVEMENT_KEYS.NOCNA_STRAZA);

  // 2. Nepogrešivi (100% na završnom modulu)
  if (!isMikroIspit && stats.postotak === 100) add(ACHIEVEMENT_KEYS.NEPOGRESIVI);

  // 3. Brzi prst (Prosjek manje od 7 sekundi po pitanju uz >90% točnosti)
  if (stats.postotak >= 90 && stats.trajanjeSekunde < stats.ukupnoPitanja * 7) {
    add(ACHIEVEMENT_KEYS.BRZI_PRST);
  }

  // 4. Završni moduli
  if (!isMikroIspit && stats.postotak >= 90) {
    if (modulIdNumerički === "1") add(ACHIEVEMENT_KEYS.MODUL_1);
    if (modulIdNumerički === "2") add(ACHIEVEMENT_KEYS.MODUL_2);
    if (modulIdNumerički === "3") add(ACHIEVEMENT_KEYS.MODUL_3);
  }

  // 5. MIKRO MAJSTORI (Čvorovi i Koloturi/Sustavi)
  if (isMikroIspit && stats.postotak === 100) {
    // Čvorovi (ID 43 ili naziv sadrži "čvor")
    if (modulIdNumerički === "43" || naziv.includes("čvor") || naziv.includes("cvor")) {
      add(ACHIEVEMENT_KEYS.MAJSTOR_CVOROVA);
    }
    // Sustavi/Koloturi (ID 44 ili naziv sadrži "sustav" ili "kolotur")
    if (modulIdNumerički === "44" || naziv.includes("sustav") || naziv.includes("kolotur")) {
      add(ACHIEVEMENT_KEYS.MAJSTOR_SUSTAVA);
    }
  }

  return newMedals;
};