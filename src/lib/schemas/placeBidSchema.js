const schema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        bidAmount: {
          type: "number",
          minimum: 1,
        },
      },
      required: ["bidAmount"],
    },
  },
  required: ["body"],
};

export default schema;
