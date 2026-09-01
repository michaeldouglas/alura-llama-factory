import path from "node:path";

import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

const globalForCheckpointer = globalThis as unknown as {
  escutiaCheckpointer: SqliteSaver | undefined;
};

export function getCheckpointer() {
  if (!globalForCheckpointer.escutiaCheckpointer) {
    const databasePath = process.env.LANGGRAPH_DATABASE_PATH || path.join(process.cwd(), "prisma", "langgraph.db");
    globalForCheckpointer.escutiaCheckpointer = SqliteSaver.fromConnString(databasePath);
  }

  return globalForCheckpointer.escutiaCheckpointer;
}
