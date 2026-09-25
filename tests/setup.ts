// `server-only` throws when imported outside a React Server environment.
// Unit tests exercise server modules directly, so it is stubbed here.
import { vi } from "vitest";

vi.mock("server-only", () => ({}));
