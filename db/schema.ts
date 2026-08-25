import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial().primaryKey(),
  name: text().notNull(),
  price: integer().notNull(),
  category: text().notNull(),
  sizes: text().notNull().default(""),
  badge: text().notNull().default(""),
  image: text().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
