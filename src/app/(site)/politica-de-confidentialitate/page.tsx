import type { Metadata } from "next";
import Link from "next/link";

import { CompanyDetails } from "@/features/legal/company";
import { LegalDocument, ToComplete } from "@/features/legal/legal-document";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Politica de confidențialitate",
  description: "Cum prelucrăm datele personale pe Alchimia Rădăcinilor.",
  alternates: { canonical: "/politica-de-confidentialitate" },
};

export default async function PrivacyPolicyPage() {
  const { legal, contact, brand } = await getSettings();
  return (
    <LegalDocument
      title="Politica de confidențialitate"
      version={legal.privacyPolicyVersion}
      intro={
        <>
          Această pagină explică ce date personale prelucrează {brand.siteName}, de ce și ce
          drepturi ai.
        </>
      }
      sections={[
        {
          id: "operator",
          title: "Cine suntem",
          body: (
            <>
              <p>Operatorul datelor tale personale este:</p>
              <CompanyDetails legal={legal} email={contact.email} />
            </>
          ),
        },
        {
          id: "date",
          title: "Ce date prelucrăm",
          body: (
            <ul>
              <li>
                <strong>Cont:</strong> prenume, nume, adresa de email, parola (stocată doar sub
                formă de hash argon2id, niciodată în clar), telefon (opțional).
              </li>
              <li>
                <strong>Adrese:</strong> adresele de livrare și facturare pe care alegi să le
                salvezi, inclusiv datele firmei (opțional).
              </li>
              <li>
                <strong>Activitate în cont:</strong> produse favorite, rezultatele quiz-ului, rutine
                salvate, coșul de cumpărături.
              </li>
              <li>
                <strong>Consimțăminte:</strong> ce ai acceptat sau retras, data, versiunea politicii
                și un identificator pseudonimizat al adresei IP.
              </li>
              <li>
                <strong>Mesaje:</strong> datele din formularul de contact (nume, email, mesaj).
              </li>
              <li>
                <strong>Comenzi:</strong>{" "}
                <ToComplete>
                  descrierea datelor de comandă și plată, după implementarea finalizării comenzii
                </ToComplete>
              </li>
            </ul>
          ),
        },
        {
          id: "scopuri",
          title: "Scopuri și temeiuri legale",
          body: (
            <>
              <p>
                Folosim datele pentru: administrarea contului, salvarea preferințelor, trimiterea
                emailurilor legate de cont (confirmare, resetare parolă) și răspunsul la mesaje.
              </p>
              <p>
                Temeiul legal pentru fiecare scop:{" "}
                <ToComplete>temeiurile juridice (art. 6 GDPR) pentru fiecare scop</ToComplete>
              </p>
            </>
          ),
        },
        {
          id: "marketing",
          title: "Newsletter și comunicări de marketing",
          body: (
            <>
              <p>
                Îți trimitem newslettere, oferte, recomandări personalizate și reduceri pe email{" "}
                <strong>doar dacă ți-ai dat acordul</strong>, bifând opțiunea dedicată (nebifată
                implicit). Acordul se activează după confirmarea adresei de email.
              </p>
              <p>
                Îți poți retrage oricând acordul din{" "}
                <Link href="/cont/newsletter" className="text-forest underline underline-offset-2">
                  Contul meu → Preferințe newsletter
                </Link>
                . Fiecare acordare sau retragere este înregistrată cu data și versiunea acestei
                politici.
              </p>
            </>
          ),
        },
        {
          id: "personalizare",
          title: "Recomandări personalizate",
          body: (
            <p>
              Recomandările din site pot ține cont de favoritele, rutinele salvate și comenzile tale
              doar dacă activezi această opțiune din cont. Fără acord, recomandările folosesc doar
              alegerile pe care le faci în quiz sau pe paginile site-ului. Recomandările sunt
              calculate după reguli fixe (fără decizii automate cu efecte juridice).
            </p>
          ),
        },
        {
          id: "destinatari",
          title: "Cui transmitem datele",
          body: (
            <ul>
              <li>
                Furnizorul de găzduire și baza de date: <ToComplete>furnizor, țară</ToComplete>
              </li>
              <li>
                Furnizorul de trimitere a emailurilor: <ToComplete>furnizor, țară</ToComplete>
              </li>
              <li>
                Curieri și procesatori de plăți (după implementarea comenzilor):{" "}
                <ToComplete>furnizori</ToComplete>
              </li>
            </ul>
          ),
        },
        {
          id: "durata",
          title: "Cât timp păstrăm datele",
          body: (
            <p>
              <ToComplete>
                perioadele de stocare pentru cont, comenzi, consimțăminte și mesaje
              </ToComplete>
            </p>
          ),
        },
        {
          id: "drepturi",
          title: "Drepturile tale",
          body: (
            <>
              <p>
                Conform Regulamentului (UE) 2016/679 (GDPR), ai dreptul de acces, rectificare,
                ștergere, restricționare, portabilitate, opoziție și dreptul de a-ți retrage
                consimțământul oricând, fără a afecta legalitatea prelucrării anterioare.
              </p>
              <p>
                Poți depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării
                Datelor cu Caracter Personal (ANSPDCP).
              </p>
              <p>
                Pentru exercitarea drepturilor, scrie-ne la{" "}
                <a
                  href={`mailto:${contact.email}`}
                  className="text-forest underline underline-offset-2"
                >
                  {contact.email}
                </a>
                .{" "}
                <ToComplete>
                  termenul de răspuns și procedura de verificare a identității
                </ToComplete>
              </p>
            </>
          ),
        },
        {
          id: "securitate",
          title: "Cum protejăm datele",
          body: (
            <p>
              Parolele sunt stocate exclusiv sub formă de hash (argon2id). Sesiunile folosesc
              cookie-uri securizate (httpOnly), iar încercările repetate de autentificare sunt
              limitate. <ToComplete>alte măsuri tehnice și organizatorice</ToComplete>
            </p>
          ),
        },
        {
          id: "cookies",
          title: "Cookie-uri",
          body: (
            <p>
              Detalii în{" "}
              <Link href="/politica-cookies" className="text-forest underline underline-offset-2">
                Politica de cookies
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
