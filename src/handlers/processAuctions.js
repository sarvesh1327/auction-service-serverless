import AWS from "aws-sdk";
import createError from "http-errors";
import { getEndedFunction } from "../lib/getEndedAuctions";

const dynamoDB = new AWS.DynamoDB.DocumentClient();
function params(id) {
  return {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: "set #status = :status",
    ExpressionAttributeValues: {
      ":status": "CLOSED",
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ReturnValues: "ALL_NEW",
  };
}

async function processAuctions(event, context) {
  console.log("processing Auction");
  try {
    let endedAuctions = await getEndedFunction();

    if (endedAuctions.length !== 0) {
      endedAuctions = await Promise.all(
        endedAuctions.map(({ id }) => dynamoDB.update(params(id)).promise())
      );
    }
    console.log(endedAuctions);
  } catch (error) {
    console.error(error);
    createError.InternalServerError(error);
  }
}

export const handler = processAuctions;
