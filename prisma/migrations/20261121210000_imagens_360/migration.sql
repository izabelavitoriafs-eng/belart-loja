-- CreateEnum
CREATE TYPE "ImageKind" AS ENUM ('GALLERY', 'SPIN');

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "kind" "ImageKind" NOT NULL DEFAULT 'GALLERY';
