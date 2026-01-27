CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#FF6B6B',
	`icon` text DEFAULT 'book',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
CREATE TABLE `flashcards` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`front` text NOT NULL,
	`back` text NOT NULL,
	`hint` text,
	`difficulty` integer DEFAULT 0,
	`last_reviewed` integer,
	`next_review` integer,
	`review_count` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `materials` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`file_uri` text NOT NULL,
	`file_name` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `study_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`cards_reviewed` integer NOT NULL,
	`correct_count` integer NOT NULL,
	`session_duration` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE cascade
);
