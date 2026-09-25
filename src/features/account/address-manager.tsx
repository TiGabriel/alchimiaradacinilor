"use client";

import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { COUNTIES } from "@/validation/address";

import { FormMessage, SubmitButton, TextField } from "../auth/components/form-bits";
import { idleState } from "../auth/form-state";

import { deleteAddressAction, saveAddressAction } from "./actions";

export type AddressView = {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  streetExtra: string | null;
  city: string;
  county: string;
  postalCode: string;
  companyName: string | null;
  vatNumber: string | null;
  tradeRegisterNo: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};

function AddressForm({ address, onDone }: { address: AddressView | null; onDone: () => void }) {
  const [state, action] = useActionState(saveAddressAction, idleState);
  const [company, setCompany] = useState(Boolean(address?.companyName));

  useEffect(() => {
    if (state.status === "success") {
      toast({ title: state.message ?? "Adresa a fost salvată.", variant: "success" });
      onDone();
    }
  }, [state, onDone]);

  const value = (key: keyof AddressView) =>
    state.values?.[key] ?? (address?.[key] as string | null | undefined) ?? "";
  const withDefaults = { ...state, values: undefined };
  const field = (
    name: keyof AddressView,
    label: string,
    extra: { autoComplete?: string; required?: boolean; type?: string } = {},
  ) => (
    <TextField
      id={`addr-${name}`}
      name={name}
      label={label}
      state={withDefaults}
      defaultValue={value(name)}
      {...extra}
    />
  );

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <FormMessage state={state.status === "error" ? state : idleState} />
      {address ? <input type="hidden" name="id" value={address.id} /> : null}
      <TextField
        id="addr-label"
        name="label"
        label="Denumire (opțional)"
        state={state}
        defaultValue={value("label")}
        hint="Ex.: Acasă, Birou"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {field("firstName", "Prenume", { autoComplete: "given-name", required: true })}
        {field("lastName", "Nume", { autoComplete: "family-name", required: true })}
      </div>
      {field("phone", "Telefon", { autoComplete: "tel", required: true, type: "tel" })}
      {field("street", "Strada și numărul", { autoComplete: "address-line1", required: true })}
      {field("streetExtra", "Bloc, scară, apartament (opțional)", {
        autoComplete: "address-line2",
      })}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("city", "Localitate", { autoComplete: "address-level2", required: true })}
        <Field id="addr-county" label="Județ" required error={state.errors?.county}>
          {(p) => (
            <select
              {...p}
              name="county"
              defaultValue={value("county")}
              className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9375rem] focus-visible:border-forest focus-visible:ring-4 focus-visible:ring-forest/12 focus-visible:outline-none"
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
      {field("postalCode", "Cod poștal", { autoComplete: "postal-code", required: true })}

      <Checkbox
        id="addr-company"
        checked={company}
        onCheckedChange={(v) => setCompany(v === true)}
        label="Adresă de facturare pentru firmă"
      />
      {company ? (
        <div className="grid gap-4 rounded-lg border border-line p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("companyName", "Denumirea firmei")}</div>
          {field("vatNumber", "CUI")}
          {field("tradeRegisterNo", "Nr. Reg. Com.")}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <Checkbox
          id="addr-ship"
          name="isDefaultShipping"
          value="on"
          defaultChecked={address?.isDefaultShipping ?? false}
          label="Adresă implicită de livrare"
        />
        <Checkbox
          id="addr-bill"
          name="isDefaultBilling"
          value="on"
          defaultChecked={address?.isDefaultBilling ?? false}
          label="Adresă implicită de facturare"
        />
      </div>
      <SubmitButton>{address ? "Salvează modificările" : "Adaugă adresa"}</SubmitButton>
    </form>
  );
}

export function AddressManager({ addresses }: { addresses: AddressView[] }) {
  const [editing, setEditing] = useState<AddressView | "new" | null>(null);
  const [deleting, startDelete] = useTransition();

  const remove = (address: AddressView) => {
    if (!window.confirm("Sigur vrei să ștergi această adresă?")) return;
    startDelete(async () => {
      const result = await deleteAddressAction(address.id);
      toast({
        title: result.message ?? "",
        variant: result.status === "success" ? "success" : "error",
      });
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {addresses.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <MapPin aria-hidden className="size-4 text-forest" />
                <span className="font-semibold">{a.label ?? `${a.firstName} ${a.lastName}`}</span>
                {a.isDefaultShipping ? (
                  <Badge variant="sage" size="sm">
                    Livrare implicită
                  </Badge>
                ) : null}
                {a.isDefaultBilling ? (
                  <Badge variant="outline" size="sm">
                    Facturare implicită
                  </Badge>
                ) : null}
              </div>
              <address className="text-sm leading-relaxed text-ink-muted not-italic">
                {a.firstName} {a.lastName} · {a.phone}
                <br />
                {a.street}
                {a.streetExtra ? `, ${a.streetExtra}` : ""}
                <br />
                {a.postalCode} {a.city}, jud. {a.county}
                {a.companyName ? (
                  <>
                    <br />
                    {a.companyName}
                    {a.vatNumber ? ` · CUI ${a.vatNumber}` : ""}
                  </>
                ) : null}
              </address>
              <div className="mt-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                  <Pencil aria-hidden /> Editează
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(a)}
                  disabled={deleting}
                  aria-label={`Șterge adresa ${a.label ?? a.street}`}
                >
                  <Trash2 aria-hidden /> Șterge
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mx-0 max-w-none rounded-xl border border-line bg-surface"
          title="Nu ai salvat încă nicio adresă."
          description="Salvează o adresă de livrare pentru a comanda mai repede."
        />
      )}
      <Button className="self-start" onClick={() => setEditing("new")}>
        <Plus aria-hidden /> Adaugă o adresă
      </Button>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Adresă nouă" : "Editează adresa"}</DialogTitle>
            <DialogDescription>Câmpurile marcate cu * sunt obligatorii.</DialogDescription>
          </DialogHeader>
          {editing ? (
            <AddressForm
              key={editing === "new" ? "new" : editing.id}
              address={editing === "new" ? null : editing}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
