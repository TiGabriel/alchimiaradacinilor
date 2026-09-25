"use client";

import { MotionProvider } from "@/components/motion";
import { Toaster } from "@/components/ui/toast";
import { SessionProvider } from "@/features/auth/session-context";
import { CartProvider } from "@/features/cart/cart-context";
import { SearchProvider } from "@/features/search/search-context";
import { WishlistProvider } from "@/features/wishlist/wishlist-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionProvider>
      <SessionProvider>
        <WishlistProvider>
          <CartProvider>
            <SearchProvider>
              {children}
              <Toaster />
            </SearchProvider>
          </CartProvider>
        </WishlistProvider>
      </SessionProvider>
    </MotionProvider>
  );
}
