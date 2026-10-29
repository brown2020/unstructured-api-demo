/**
 * The SDK always appends `/general/v0/general` to `serverURL`.
 * A full endpoint in UNSTRUCTURED_API_URL would be joined a second time.
 */

const PARTITION_PATH = "/general/v0/general";

export function normalizeUnstructuredServerURL(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("UNSTRUCTURED_API_URL is invalid.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("UNSTRUCTURED_API_URL is invalid.");
  }

  let path = url.pathname.replace(/\/+$/, "");
  while (path.endsWith(PARTITION_PATH)) {
    path = path.slice(0, -PARTITION_PATH.length).replace(/\/+$/, "");
  }

  url.pathname = path ? path : "/";
  url.search = "";
  url.hash = "";

  if (url.pathname === "/") return url.origin;
  return `${url.origin}${url.pathname}`;
}

/** Same pathname join the Unstructured SDK uses in `_createRequest`. */
export function sdkPartitionURL(serverURL: string): string {
  const path = PARTITION_PATH;
  const reqURL = new URL(serverURL);
  const inputURL = new URL(path, reqURL);
  reqURL.pathname += reqURL.pathname.endsWith("/") ? "" : "/";
  reqURL.pathname += inputURL.pathname.replace(/^\/+/, "");
  return reqURL.toString();
}
