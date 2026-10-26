-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'OPERATOR') NOT NULL DEFAULT 'OPERATOR',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(160) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `allow_marketing_sms` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `customers_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `plate` VARCHAR(16) NOT NULL,
    `brand_model` VARCHAR(120) NULL,
    `segment` ENUM('SEDAN', 'SUV', 'VAN') NOT NULL DEFAULT 'SEDAN',
    `last_visit_at` DATETIME(3) NULL,
    `last_retention_sms_at` DATETIME(3) NULL,

    UNIQUE INDEX `vehicles_plate_key`(`plate`),
    INDEX `vehicles_customer_id_idx`(`customer_id`),
    INDEX `vehicles_last_visit_at_idx`(`last_visit_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_tickets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticket_code` VARCHAR(20) NOT NULL,
    `vehicle_id` INTEGER NOT NULL,
    `status` ENUM('QUEUED', 'WASHING', 'DETAILING', 'READY', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'QUEUED',
    `total_price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `tracking_token` VARCHAR(16) NOT NULL,
    `estimated_ready_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,

    UNIQUE INDEX `job_tickets_ticket_code_key`(`ticket_code`),
    UNIQUE INDEX `job_tickets_tracking_token_key`(`tracking_token`),
    INDEX `job_tickets_status_idx`(`status`),
    INDEX `job_tickets_vehicle_id_idx`(`vehicle_id`),
    INDEX `job_tickets_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_ticket_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticket_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,

    INDEX `job_ticket_services_service_id_idx`(`service_id`),
    UNIQUE INDEX `job_ticket_services_ticket_id_service_id_key`(`ticket_id`, `service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_queue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(20) NOT NULL,
    `type` ENUM('INTAKE', 'READY', 'RETENTION') NOT NULL,
    `template_name` VARCHAR(120) NULL,
    `language_code` VARCHAR(10) NOT NULL DEFAULT 'tr',
    `params` JSON NULL,
    `preview` TEXT NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `retries` INTEGER NOT NULL DEFAULT 0,
    `error_log` TEXT NULL,
    `scheduled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `message_queue_status_scheduled_at_idx`(`status`, `scheduled_at`),
    INDEX `message_queue_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `key` VARCHAR(80) NOT NULL,
    `value` TEXT NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_tickets` ADD CONSTRAINT `job_tickets_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_ticket_services` ADD CONSTRAINT `job_ticket_services_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `job_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_ticket_services` ADD CONSTRAINT `job_ticket_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
