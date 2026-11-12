"use client";

interface ApiKeySetupProps {
  apiKey: string;
  saved: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onRemove: () => void;
}

export default function ApiKeySetup({
  apiKey,
  saved,
  onChange,
  onSave,
  onRemove,
}: ApiKeySetupProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">API Key Setup</h2>

      <input
        type="password"
        value={apiKey}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter project API key"
        className="w-full rounded-md border px-3 py-2"
      />

      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Save API Key
        </button>

        <button
          onClick={onRemove}
          className="rounded-md border px-4 py-2"
        >
          Remove
        </button>
      </div>

      {saved && (
        <p className="text-sm text-green-600">
          API key saved successfully.
        </p>
      )}
    </section>
  );
}