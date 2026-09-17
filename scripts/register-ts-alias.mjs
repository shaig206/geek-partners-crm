/** Register the @/ path alias so node --test can import app modules. */
import { register } from "node:module";

register(new URL("./ts-alias-loader.mjs", import.meta.url));
