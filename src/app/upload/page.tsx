import { UploadReceiptFlow } from "@/components/upload-receipt-flow";

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ shared?: string }>;
}) {
  const { shared } = await searchParams;
  const sharedPath = shared && /^shared\/[a-f0-9-]+\.(jpg|png|webp)$/.test(shared)
    ? shared
    : undefined;

  return (
    <main className="flex-1 px-5 py-10 sm:px-8 sm:py-16">
      <UploadReceiptFlow sharedPath={sharedPath} />
    </main>
  );
}
