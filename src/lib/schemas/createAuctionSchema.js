const schema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      properties: {
        title: {
          type: "string",
          minLength: 3,
        },
      },
      required: ["title"],
    },
  },
  required: ["body"],
};
export default schema;
