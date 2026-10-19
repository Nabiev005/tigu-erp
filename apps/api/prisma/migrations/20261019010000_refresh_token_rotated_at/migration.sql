-- Grace window for concurrent refreshes (two tabs, React StrictMode).
ALTER TABLE "RefreshToken" ADD COLUMN "rotatedAt" TIMESTAMP(3);
