import { init } from "@instantdb/react";
import schema from "../../instant.schema";

const APP_ID = "e9ea441e-aeb5-4971-9e48-092e402cc904";

export const db = init({
  appId: APP_ID,
  schema,
});
