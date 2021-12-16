import AWS from "aws-sdk";
import createError from "http-errors";
import { getEndedFunction } from "../lib/getEndedAuctions";

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

const sendMessage = async ({ recipient, body, subject }) => {
  return sqs
    .sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject,
        body,
        recipient,
      }),
    })
    .promise();
};

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
        endedAuctions.map((auction) => {
          const updateDB=dynamoDB.update(params(auction.id)).promise();
          const { title, seller, highestBid } = auction;
          const { amount, bidder } = highestBid;
          const notifySeller = sendMessage({
            subject: "Your Item has been sold",
            recipient: seller,
            body: `Congratulation!! Your stuff ${title} was bought successfully by ${bidder} at $${amount}`,
          });
          const notifyBidder = sendMessage({
            subject: "Yah got it",
            recipient: bidder,
            body: `Congo your bid for ${title} of amount $${amount} has been successful`,
          });
          return Promise.all([notifyBidder, notifySeller, updateDB]);
        })
      );
    }
    console.log(endedAuctions);
  } catch (error) {
    console.error(error);
    createError.InternalServerError(error);
  }
}

export const handler = processAuctions;
