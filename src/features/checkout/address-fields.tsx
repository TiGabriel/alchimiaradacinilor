"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import { addressSchema, COUNTIES } from "@/validation/address";

export const ADDRESS_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "street",
  "streetExtra",
  "city",
  "county",
  "postalCode",
  "companyName",
  "vatNumber",
  "tradeRegisterNo",
] as const;

export type AddressFieldName = (typeof ADDRESS_FIELDS)[number];
export type AddressDraft = Record<AddressFieldName, string>;
export type AddressErrors = Partial<Record<AddressFieldName, string>>;

export function emptyAddress(prefill: Partial<AddressDraft> = {}): AddressDraft {
  return {
    ...(Object.fromEntries(ADDRESS_FIELDS.map((f) => [f, ""])) as AddressDraft),
    ...prefill,
  };
}

/**
 * Validates with the server's Zod schema for instant feedback. Returns the raw
 * input (strings) to submit — the server parses it again itself.
 */
export function validateAddress(draft: AddressDraft, company: boolean) {
  const input: AddressDraft = company
    ? draft
    : { ...draft, companyName: "", vatNumber: "", tradeRegisterNo: "" };
  const result = addressSchema.safeParse(input);
  if (result.success) return { ok: true as const, input };
  const errors: AddressErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as AddressFieldName;
    errors[key] ??= issue.message;
  }
  return { ok: false as const, errors };
}

/** Server field errors ("shipping.address.phone") → errors for one address form. */
export function addressErrorsFrom(
  fieldErrors: Record<string, string>,
  prefix: string,
): AddressErrors {
  const errors: AddressErrors = {};
  for (const [path, message] of Object.entries(fieldErrors)) {
    if (!path.startsWith(`${prefix}.address.`)) continue;
    errors[path.slice(prefix.length + ".address.".length) as AddressFieldName] ??= message;
  }
  return errors;
}

const selectClass =
  "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9375rem] focus-visible:border-forest focus-visible:ring-4 focus-visible:ring-forest/12 focus-visible:outline-none aria-invalid:border-danger";

/** Controlled address fieldset (checkout). */
export function AddressFields({
  idPrefix,
  legend,
  value,
  errors,
  onChange,
  company,
  onCompanyChange,
}: {
  idPrefix: string;
  legend: string;
  value: AddressDraft;
  errors: AddressErrors;
  onChange: (next: AddressDraft) => void;
  company: boolean;
  onCompanyChange: (company: boolean) => void;
}) {
  const set =
    (name: AddressFieldName) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange({ ...value, [name]: e.target.value });
    };
  const text = (
    name: AddressFieldName,
    label: string,
    extra: {
      autoComplete?: string;
      required?: boolean;
      type?: string;
      inputMode?: "numeric" | "tel";
    } = {},
  ) => (
    <Field id={`${idPrefix}-${name}`} label={label} required={extra.required} error={errors[name]}>
      {(p) => (
        <Input
          {...p}
          name={name}
          type={extra.type}
          inputMode={extra.inputMode}
          autoComplete={
            extra.autoComplete
              ? `${idPrefix === "billing" ? "billing " : "shipping "}${extra.autoComplete}`
              : undefined
          }
          value={value[name]}
          onChange={set(name)}
        />
      )}
    </Field>
  );

  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {text("firstName", "Prenume", { autoComplete: "given-name", required: true })}
        {text("lastName", "Nume", { autoComplete: "family-name", required: true })}
      </div>
      {text("phone", "Telefon", {
        autoComplete: "tel",
        required: true,
        type: "tel",
        inputMode: "tel",
      })}
      {text("street", "Strada și numărul", { autoComplete: "address-line1", required: true })}
      {text("streetExtra", "Bloc, scară, apartament (opțional)", { autoComplete: "address-line2" })}
      <div className="grid gap-4 sm:grid-cols-2">
        {text("city", "Localitate", { autoComplete: "address-level2", required: true })}
        <Field id={`${idPrefix}-county`} label="Județ" required error={errors.county}>
          {(p) => (
            <select
              {...p}
              name="county"
              value={value.county}
              onChange={set("county")}
              autoComplete={`${idPrefix === "billing" ? "billing" : "shipping"} address-level1`}
              className={selectClass}
            >
              <option value="">Alege județul</option>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      {text("postalCode", "Cod poștal", {
        autoComplete: "postal-code",
        required: true,
        inputMode: "numeric",
      })}
      <Checkbox
        id={`${idPrefix}-company`}
        checked={company}
        onCheckedChange={(v) => onCompanyChange(v === true)}
        label="Factură pe firmă"
      />
      {company ? (
        <div className="grid gap-4 rounded-lg border border-line p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {text("companyName", "Denumirea firmei", { autoComplete: "organization" })}
          </div>
          {text("vatNumber", "CUI")}
          {text("tradeRegisterNo", "Nr. Reg. Com.")}
        </div>
      ) : null}
    </fieldset>
  );
}
