import type { SettingValue } from "@/validation/settings";

import { ToComplete } from "./legal-document";

/** Operator identity from SiteSettings (`legal`), or visible placeholders until provided. */
export function CompanyDetails({ legal, email }: { legal: SettingValue<"legal">; email: string }) {
  return (
    <ul>
      <li>Denumire: {legal.companyName ?? <ToComplete>denumirea operatorului</ToComplete>}</li>
      <li>
        Nr. Reg. Com.: {legal.companyRegistration ?? <ToComplete>număr de înregistrare</ToComplete>}
      </li>
      <li>CUI: {legal.companyVatNumber ?? <ToComplete>cod unic de înregistrare</ToComplete>}</li>
      <li>Sediu: {legal.companyAddress ?? <ToComplete>adresa sediului</ToComplete>}</li>
      <li>
        Email:{" "}
        <a href={`mailto:${email}`} className="text-forest underline underline-offset-2">
          {email}
        </a>
      </li>
    </ul>
  );
}
