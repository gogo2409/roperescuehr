RopeRescueHR - Proračun Sila u Sustavima za Spašavanje Užetom.

O Projektu

RopeRescueHR je specijalizirana web aplikacija namijenjena spasiocima, pripadnicima Gorskih službi spašavanja (HGSS), alpinistima i tehničarima za rad na visini. Njen je primarni cilj transformirati složene inženjerske proračune u jednostavno i brzo digitalno rješenje.

Glavni zadatak projekta je pružiti brz, pouzdan i precizan proračun sila i opterećenja unutar kompleksnih sustava za podizanje i spuštanje užetom. Time se minimizira rizik od ljudske pogreške uslijed ručnog izračuna na terenu i drastično povećava sigurnost cijele spasilačke operacije.

Aplikacija omogućuje korisnicima intuitivan unos ključnih parametara, kao što su:

Masa tereta (osoba, oprema).

Specifikacije korištene opreme (faktori trenja, efikasnost kolotura).

Kutovi pod kojima se sile primjenjuju.

Na temelju unesenih podataka, aplikacija trenutno vizualizira i prikazuje opterećenja na sidrište, radno uže i ključne točke sustava.

Ključne Značajke

Proračun Faktora Sigurnosti: Trenutna provjera je li izračunato opterećenje unutar sigurnosnih granica preporučenih standardima.

Podrška za Sustave: Uključuje proračune za standardne koloturne sustave (npr. 3:1, 5:1), sustave s preusmjeravanjem i kompleksne tehničke postavke za spašavanje.

Intuitivno Sučelje (UI/UX): Dizajnirano za brzu upotrebu, čitljivost i funkcionalnost na mobilnim uređajima i tabletima, što je ključno za rad na terenu.

Metričke Jedinice: Fokus na standardizirane metričke jedinice (kg, kN, m) prilagođene za Hrvatsku i regiju.

Lokalno Spremanje Podataka (Planirano): Mogućnost spremanja konfiguracija sustava za brzu ponovnu upotrebu ili za offline analizu.

Tehnologije

Ovaj projekt je izgrađen s naglaskom na brzinu, pouzdanost i laganu izvedbu:

HTML5 & CSS3: Osnovna struktura i stiliziranje.

JavaScript (ES6+): Logika proračuna, rukovanje unosom korisnika i interaktivnost sučelja.

Tailwind CSS (ili sličan framework): Za brzi i responzivni dizajn sučelja.

Firebase Hosting: Koristi se za stabilno i globalno distribuirano postavljanje (deployment) aplikacije.

CI/CD i Automatizacija Postavljanja

Ovaj repozitorij koristi GitHub Actions za automatizirani tijek rada (Continuous Integration/Continuous Deployment - CI/CD).

Tok posla je definiran u datoteci .github/workflows/main.yml.

Automatizirano postavljanje na Firebase Hosting:
Svaki put kada se novi kod gurne (push) na glavnu granu (main), GitHub Actions automatski pokreće sljedeće korake:

Provjera koda.

Instalacija ovisnosti.

Izgradnja projekta (ako je potrebno).

Postavljanje na Firebase Hosting koristeći sigurnosni ključ.

Postavljanje Projekta (Za Developere)

Za pokretanje projekta lokalno ili doprinošenje razvoju, pratite sljedeće korake:

Klonirajte Repozitorij:

git clone [https://github.com/gogo2409/roperescuehr.git](https://github.com/gogo2409/roperescuehr.git)
cd roperescuehr


Instalacija ovisnosti (ako se koristi Node.js / npm):

npm install


Pokretanje Aplikacije:

Ako je ovo čisti HTML/CSS/JS projekt bez build procesa, jednostavno otvorite index.html u Vašem pregledniku.

Ako postoji build proces (npr. za Tailwind):

npm run dev 


Licenca

Ovaj projekt je otvorenog koda i licenciran pod MIT Licencom.
