const { v4: uuid } = require("uuid");
const AWS = require("aws-sdk");
const createError = require("http-errors");
import validator from "@middy/validator";
import middyStuff from "../lib/commonMiddlerware";
import createAuctionSchema from "../lib/schemas/createAuctionSchema";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  const { title } = event.body;
  const {email} = event.requestContext.authorizer;
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1);
  const auction = {
    id: uuid(),
    title,
    seller: email,
    status: "OPEN",
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
    },
    createdAt: new Date().toISOString(),
  };
  try {
    await dynamoDB
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: auction,
      })
      .promise();
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }
  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
}

export const handler = middyStuff(createAuction).use(
  validator({ inputSchema: createAuctionSchema })
);
