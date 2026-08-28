import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  sizes: text("sizes").notNull().default(""),
  badge: text("badge").notNull().default(""),
  image: text("image").notNull(),
  description: text("description").default(""),
  brand: text("brand").default(""),
  stock: integer("stock").default(0),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
