const mondayService = require('../services/monday-service');
const transformationService = require('../services/transformation-service');
const { TRANSFORMATION_TYPES } = require('../constants/transformation');
const axios = require('axios');

async function executeAction(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  try {
    const { inputFields } = payload;
    const { boardId, itemId, sourceColumnId, targetColumnId, transformationType } = inputFields;

    console.log(inputFields);
    const text = await mondayService.getColumnValue(shortLivedToken, itemId, sourceColumnId);
    if (!text) {
      return res.status(200).send({});
    }
    const transformedText = transformationService.transformText(
      text,
      transformationType ? transformationType.value : 'TO_UPPER_CASE'
    );

    await mondayService.changeColumnValue(shortLivedToken, boardId, itemId, targetColumnId, transformedText);

    return res.status(200).send({});
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}

async function notifyWhatsapp(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  console.log('payload:', payload);

  try {
    const { inputFields } = payload;
    const { itemId, columnId, message } = inputFields;
    const phoneValue = await mondayService.getPhoneValue(shortLivedToken, itemId, columnId);

    if (!phoneValue || !phoneValue.phone) {
      throw new Error('Phone value not found');
    }
    const phone = phoneValue.phone;
    console.log(phone, 'this is the phone value');
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: phone,
        text: {
          body: message
        },
      },
    });
    return res.status(200).send({});
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}

async function notifyMessage(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  console.log('payload:', payload);

  try {
    const { inputFields } = payload;
    const { boardId, itemId, columnId, message } = inputFields;

    // Get the phone value from the specified item and column
    const phoneValue = await mondayService.getPhoneValue(shortLivedToken, itemId, columnId);

    if (!phoneValue || !phoneValue.phone) {
      throw new Error('Phone value not found');
    }
    const phone = phoneValue.phone;
    console.log(phone, 'this is the phone value');

    // Fetch all column values for the item
    const columnValues = await mondayService.getColumnValues(shortLivedToken, itemId);

    // Create an object to store the values with their titles
    const values = {};
    columnValues.forEach(column => {
      values[column.title.toLowerCase().replace(/\s+/g, '_')] = JSON.parse(column.value).text || column.value;
    });

    // Replace placeholders in the message with actual column values
    let populatedMessage = message;
    Object.keys(values).forEach(key => {
      const placeholder = `{pulse.${key}}`;
      populatedMessage = populatedMessage.replace(new RegExp(placeholder, 'g'), values[key]);
    });

    console.log(populatedMessage, 'this is the populated message');

    // Send WhatsApp message using Meta API
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: phone,
        text: {
          body: populatedMessage
        },
      },
    });

    return res.status(200).send({});
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}

// this function is just to send the message, not changing status.
// there's a problem with the naming
async function notifyWhatsappChangeStatus(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  console.log('payload:', payload);

  try {
    const { inputFields } = payload;
    const { boardId, itemId, columnId, statusColumnValue, message } = inputFields;

    // Get the phone value from the specified item and column
    const phoneValue = await mondayService.getPhoneValue(shortLivedToken, itemId, columnId);

    if (!phoneValue || !phoneValue.phone) {
      throw new Error('Phone value not found');
    }

    const phone = phoneValue.phone;
    console.log(phone, 'this is the phone value');

    // Send WhatsApp message using Meta API
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: phone,
        text: {
          body: message
        },
      },
    });

    return res.status(200).send({});
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}

async function getPhoneNumber(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  console.log('payload:', payload);

  try {
    const { inputFields } = payload;
    const { itemId, columnId } = inputFields;

    const phoneValue = await mondayService.getPhoneValue(shortLivedToken, itemId, columnId);

    console.log(phoneValue);
    return res.status(200).send(phoneValue);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}

async function getRemoteListOptions(req, res) {
  try {
    return res.status(200).send(TRANSFORMATION_TYPES);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}

async function createNewItem(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  try {
    const { inputFields } = payload;
    console.log(inputFields);
    const { boardId, groupId, sender, display_name} = inputFields;

    await mondayService.createNewItem(boardId, groupId, display_name, sender);
    
    // console.log(req);
    // Define the value here
    // const newLeadValue = JSON.stringify("valerie");
    // const newLeadValue = JSON.stringify(displayName);

    // Retrieve displayName from session and set it as the value
    //  const displayName = req.session.displayName || "default value";
    //  const newLeadValue = JSON.stringify(displayName);

    // Set the value using the changeColumnValue function
    // await mondayService.changeColumnValue(shortLivedToken, boardId, itemId, targetColumnId, newLeadValue);
  
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}
async function sendMessageChangeStatus(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  console.log('payload:', payload);

  try {
    const { inputFields } = payload;
    const { boardId, itemId, columnId, statusId, statusColumnValue, message } = inputFields;

    // Get the phone value from the specified item and column
    const phoneValue = await mondayService.getPhoneValue(shortLivedToken, itemId, columnId);

    if (!phoneValue || !phoneValue.phone) {
      throw new Error('Phone value not found');
    }

    const phone = phoneValue.phone;
    console.log(phone, 'this is the phone value');

    // Send WhatsApp message using Meta API
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
      },
      data: {
        messaging_product: "whatsapp",
        to: phone,
        text: {
          body: message
        },
      },
    });

    // Change the status column value
    console.log('Sending status change with:', { boardId, itemId, statusId, statusColumnValue });
    const changeStatusResponse = await mondayService.changeStatusColumnValue(shortLivedToken, boardId, itemId, statusId, statusColumnValue);
    console.log('change status response', changeStatusResponse);

    return res.status(200).send({});
  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: 'internal server error' });
  }
}

async function checkStatusSendMessage(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  console.log('Received payload:', JSON.stringify(payload, null, 2));

  try {
    const { inputFields } = payload;
    const { boardId, itemId, columnId, statusId, statusColumnValue, message } = inputFields;

    console.log('Input Fields:', inputFields);

    // Check if necessary input fields are provided
    if (!boardId || !itemId || !statusId || !message || !columnId || !statusColumnValue) {
      throw new Error('Missing required input fields');
    }

    // Get the status value
    const statusValue = await mondayService.getColumnValue(shortLivedToken, itemId, statusId);

    console.log('Status Value:', statusValue);

    // Check if status value is found
    if (!statusValue) {
      throw new Error('Status value not found');
    }

    // Parse status value as it might be a stringified JSON
    const statusValueParsed = JSON.parse(statusValue);

    console.log('Parsed Status Value:', statusValueParsed);

    // Check if status index matches the condition
    if (statusValueParsed.index === statusColumnValue.index) {
      console.log('Condition met, preparing to send message.');

      // Get the phone value
      const phoneValue = await mondayService.getPhoneValue(shortLivedToken, itemId, columnId);

      console.log('Phone Value:', phoneValue);

      if (!phoneValue || !phoneValue.phone) {
        throw new Error('Phone value not found');
      }

      const phone = phoneValue.phone;
      console.log(phone, 'this is the phone value');

      // Send WhatsApp message
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: phone,
          text: {
            body: message
          },
        },
      });

      console.log('WhatsApp message sent successfully');
    } else {
      console.log('Condition not met, no message sent.');
    }

    return res.status(200).send({});
  } catch (err) {
    console.error('Error in checkStatusSendMessage:', err.message);
    return res.status(500).send({ message: 'internal server error' });
  }
}

async function checkStatusNotSendMessage(req, res) {
  const { shortLivedToken } = req.session;
  const { payload } = req.body;

  console.log('Received payload:', JSON.stringify(payload, null, 2));

  try {
    const { inputFields } = payload;
    const { boardId, itemId, columnId, statusId, statusColumnValue, message } = inputFields;

    console.log('Input Fields:', inputFields);

    // Check if necessary input fields are provided
    if (!boardId || !itemId || !statusId || !message || !columnId || !statusColumnValue) {
      throw new Error('Missing required input fields');
    }

    // Get the status value
    const statusValue = await mondayService.getColumnValue(shortLivedToken, itemId, statusId);

    console.log('Status Value:', statusValue);

    // Check if status value is found
    if (!statusValue) {
      throw new Error('Status value not found');
    }

    // Parse status value as it might be a stringified JSON
    const statusValueParsed = JSON.parse(statusValue);

    console.log('Parsed Status Value:', statusValueParsed);

    // Check if status index does not match the condition
    if (statusValueParsed.index !== statusColumnValue.index) {
      console.log('Condition met, preparing to send message.');

      // Get the phone value
      const phoneValue = await mondayService.getPhoneValue(shortLivedToken, itemId, columnId);

      console.log('Phone Value:', phoneValue);

      if (!phoneValue || !phoneValue.phone) {
        throw new Error('Phone value not found');
      }

      const phone = phoneValue.phone;
      console.log(phone, 'this is the phone value');

      // Send WhatsApp message
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to: phone,
          text: {
            body: message
          },
        },
      });

      console.log('WhatsApp message sent successfully');
    } else {
      console.log('Condition not met, no message sent.');
    }

    return res.status(200).send({});
  } catch (err) {
    console.error('Error in checkStatusSendMessageNot:', err.message);
    return res.status(500).send({ message: 'internal server error' });
  }
}

module.exports = {
  executeAction,
  getRemoteListOptions,
  notifyWhatsapp,
  notifyWhatsappChangeStatus,
  getPhoneNumber,
  notifyMessage,
  createNewItem,
  sendMessageChangeStatus,
  checkStatusSendMessage,
  checkStatusNotSendMessage
};
