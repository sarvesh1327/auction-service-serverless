const AWS = require("aws-sdk");
import middyStuff from "../lib/commonMiddlerware";
const createError = require("http-errors");

const dynamoDB = new AWS.DynamoDB.DocumentClient();
export async function getAuctionByID(id) {
  let auction = null;
  try {
    const results = await dynamoDB
      .get({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
      })
      .promise();
    auction = results.Item;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
  if (!auction) {
    throw new createError.NotFound(`Auction with ID ${id} not found`);
  }
  return auction;
}

async function getAuctionById(event, context) {
  const { id } = event.pathParameters;
  const auction = await getAuctionByID(id);
  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
}

export const handler = middyStuff(getAuctionById);
