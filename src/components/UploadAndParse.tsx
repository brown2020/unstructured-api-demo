import { ClientUploadPanel } from "@/components/upload/ClientUploadPanel";

export function UploadAndParse() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <header className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-600">
          Unstructured API Demo
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
          Transform unstructured files into clean, structured data
        </h1>
        <p className="text-base text-gray-600 max-w-2xl mx-auto">
          Upload PDFs or images and we will stream them through Unstructured.io
          for layout-aware parsing. Results appear instantly with both readable
          and raw JSON views.
        </p>
      </header>

      <ClientUploadPanel />
    </section>
  );
}
