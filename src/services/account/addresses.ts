import "server-only";

import { db } from "@/lib/db";
import type { AddressInput } from "@/validation/address";

export const MAX_ADDRESSES = 10;

export class AddressError extends Error {}

export function listAddresses(userId: string) {
  return db.address.findMany({
    where: { userId },
    orderBy: [{ isDefaultShipping: "desc" }, { isDefaultBilling: "desc" }, { createdAt: "asc" }],
  });
}

/** Creates or updates an address the user owns; keeps at most one default of each kind. */
export async function saveAddress(userId: string, input: AddressInput, addressId?: string) {
  return db.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId } });
    if (!addressId && count >= MAX_ADDRESSES)
      throw new AddressError(`Poți salva cel mult ${MAX_ADDRESSES} adrese.`);
    if (addressId) {
      const owned = await tx.address.findFirst({
        where: { id: addressId, userId },
        select: { id: true },
      });
      if (!owned) throw new AddressError("Adresa nu a fost găsită.");
    }
    // The first address becomes the default for both shipping and billing.
    const first = count === 0;
    const data = {
      ...input,
      isDefaultShipping: input.isDefaultShipping || first,
      isDefaultBilling: input.isDefaultBilling || first,
    };
    if (data.isDefaultShipping)
      await tx.address.updateMany({ where: { userId }, data: { isDefaultShipping: false } });
    if (data.isDefaultBilling)
      await tx.address.updateMany({ where: { userId }, data: { isDefaultBilling: false } });
    return addressId
      ? tx.address.update({ where: { id: addressId }, data })
      : tx.address.create({ data: { ...data, userId } });
  });
}

export async function deleteAddress(userId: string, addressId: string) {
  await db.$transaction(async (tx) => {
    const address = await tx.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new AddressError("Adresa nu a fost găsită.");
    await tx.address.delete({ where: { id: addressId } });
    // Promote another address if a default was removed.
    const next = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
    if (next && (address.isDefaultShipping || address.isDefaultBilling)) {
      await tx.address.update({
        where: { id: next.id },
        data: {
          ...(address.isDefaultShipping ? { isDefaultShipping: true } : {}),
          ...(address.isDefaultBilling ? { isDefaultBilling: true } : {}),
        },
      });
    }
  });
}
