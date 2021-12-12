const AWS = require("aws-sdk");
const createError = require("http-errors");
import validator from "@middy/validator";
import middyStuff from "../lib/commonMiddlerware";
import placeBidSchema from "../lib/schemas/placeBidSchema";
import { getAuctionByID } from "./getAuctionById";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { bidAmount } = event.body;
  const { highestBid, status } = await getAuctionByID(id);
  if (status === "CLOSED") {
    throw new createError.NotAcceptable("This auction has closed already been closed");
  }
  if (highestBid.amount >= bidAmount) {
    throw new createError.NotAcceptable(
      "BidAmount should be greater than highest bid"
    );
  }
  let updatedAuction = null;
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: "set highestBid.amount = :amount",
    ExpressionAttributeValues: {
      ":amount": bidAmount,
    },
    ReturnValues: "ALL_NEW",
  };
  try {
    const result = await dynamoDB.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = middyStuff(placeBid).use(validator({inputSchema: placeBidSchema}));
