import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial().primaryKey(),
  name: text().notNull(),
  price: integer().notNull(),
  category: text().notNull(),
  brand: text().notNull().default(""),
  sizes: text().notNull().default(""),
  stock: integer().notNull().default(10),
  badge: text().notNull().default(""),
  image: text().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
