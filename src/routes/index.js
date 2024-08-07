const axios = require('axios');
const router = require('express').Router();
const mondayRoutes = require('./monday');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const { WEBHOOK_VERIFY_TOKEN, GRAPH_API_TOKEN, MONDAY_SIGNING_SECRET } = process.env;

let webhookUrl = 'https://automations-au.monday.com/apps-events/8691469';

router.use(mondayRoutes);

router.get('/', function (req, res) {
  res.json(getHealth());
});

router.get('/health', function (req, res) {
  res.json(getHealth());
  res.end();
});

router.post('/get_server', function (req, res) {
  console.log(req.body);
  console.log("Done");
  res.sendStatus(200);
});

function getHealth() {
  return {
    message: 'Healthy',
  };
}

router.post("/subscribe", function (req, res) {
  console.log("Request body: ", req.body);
  console.log("Webhook URL: ", req.body.payload.webhookUrl);
  fs.writeFileSync()
  webhookUrl = req.body.payload.webhookUrl;
  // console.log("Response is: ", res);
  res.status(200).json(
    {
      "webhookId": 111
    }
  );
})

router.post("/webhook", async (req, res) => {
  // log incoming messages
  console.log("Incoming webhook message: ", JSON.stringify(req.body, null, 2));

  // check if the webhook request contains a message
  // details on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];

  console.log("Message:", JSON.stringify(message));
  console.log(req.body);
  // check if the incoming message contains text
  if (message?.type === "text") {
    const sender = message.from;
    const body = message.text.body;
    const displayName = req.body.entry?.[0]?.changes[0]?.value?.contacts?.[0]?.profile?.name;

    console.log("From:", sender);
    console.log("Body:", body);
    console.log("Display Name:", displayName);

    console.log(webhookUrl);
    await axios({
      method: "POST",
      url: webhookUrl,
      headers: {
        'authorization': MONDAY_SIGNING_SECRET
      },
      data: {
        "trigger": {
          "outputFields": { // values of all output fields, which were configured for your custom trigger
            "sender": sender,
            "display_name": displayName
          }
        }
      }
    });

    // extract the business number to send the reply from it
    const business_phone_number_id =
      req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;

    // send a reply message as per the docs here https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: message.from,
        text: { body: "Thanks for contacting us. Will respond to you shortly."},
        context: {
          message_id: message.id, // shows the message as a reply to the original user message
        },
      },
    });

    // mark incoming message as read
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        status: "read",
        message_id: message.id,
      },
    });
    // await mondayService.createNewItem(1889457017, "topics", displayName, sender)
    }
  res.sendStatus(200);
});

// accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // check the mode and token sent are correct
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    // respond with 200 OK and challenge token from the request
    res.status(200).send(challenge);
    console.log("Webhook verified successfully!");
  } else {
    // respond with '403 Forbidden' if verify tokens do not match
    res.sendStatus(403);
  }
});

module.exports = router;
