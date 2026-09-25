/** Pure formatting helpers for order views and emails. */

type AddressLike = {
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string | null;
  vatNumber: string | null;
  street: string;
  streetExtra: string | null;
  city: string;
  county: string;
  postalCode: string;
};

/** Postal address as display lines (company first when present). */
export function formatAddressLines(a: AddressLike): string[] {
  return [
    `${a.firstName} ${a.lastName}`,
    ...(a.companyName ? [`${a.companyName}${a.vatNumber ? `, CUI ${a.vatNumber}` : ""}`] : []),
    [a.street, a.streetExtra].filter(Boolean).join(", "),
    `${a.postalCode} ${a.city}, jud. ${a.county}`,
    a.phone,
  ];
}
