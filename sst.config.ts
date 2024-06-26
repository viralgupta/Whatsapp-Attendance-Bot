import { SSTConfig } from "sst";
import { API } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "WhatsappAttendanceBot",
      region: "ap-south-1",
    };
  },
  stacks(app) {
    app.stack(API);
  }
} satisfies SSTConfig;
