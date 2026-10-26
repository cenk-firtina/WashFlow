-- AlterTable
ALTER TABLE `services` ADD COLUMN `category` VARCHAR(60) NOT NULL DEFAULT 'Genel';

-- CreateIndex
CREATE INDEX `services_category_idx` ON `services`(`category`);
