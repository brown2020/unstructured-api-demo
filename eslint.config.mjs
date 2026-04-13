import { fixupConfigRules } from "@eslint/compat";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...fixupConfigRules([...nextCoreWebVitals, ...nextTypescript]),
];

export default config;
