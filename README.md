# ReceiptSnap

A mobile-first receipt organizer built with Next.js, Supabase, Tesseract.js, shadcn/ui, and Recharts.

## Setup

1. Run `supabase/migrations/20260709000000_create_receipts.sql` in Supabase.
2. Copy `.env.example` to `.env.local` and add the project values.
3. Run `npm install` and `npm run dev`.

The browser upload flow performs OCR locally, asks the user to review every extracted field, and only writes a receipt after **Confirm & save receipt** is pressed.

## Shortcut upload API

`POST /api/receipts/upload` accepts either:

- Raw image bytes with an image `Content-Type`, or
- `multipart/form-data` with an `image` or `file` field.

Example:

```bash
curl -X POST \
  -H "Content-Type: image/jpeg" \
  --data-binary @receipt.jpg \
  http://localhost:3000/api/receipts/upload
```

The endpoint uploads the image and returns OCR-extracted draft data with `requires_confirmation: true`. It intentionally does not insert a row into `receipts`; a caller must present and explicitly confirm the draft first.

## Security note

The migration enables RLS. Because this hackathon MVP has no user accounts, read and insert access is available to Supabase `anon` and `authenticated` roles. Add authentication and owner-scoped policies before storing private production data.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
