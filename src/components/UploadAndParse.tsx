import { ClientUploadPanel } from "@/components/upload/ClientUploadPanel";

export function UploadAndParse() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <header className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-800 font-medium">
          Unstructured API Demo
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
          Transform unstructured files into clean, structured data
        </h1>
        <p className="text-base text-gray-600 max-w-2xl mx-auto">
          Upload a BMP, DOCX, HEIC, JPEG, PDF, PNG, PPTX, or TIFF file. It is
          parsed with the Unstructured Transform API, then shown as readable
          sections or raw JSON.
        </p>
      </header>

      <ClientUploadPanel />
    </section>
  );
}
