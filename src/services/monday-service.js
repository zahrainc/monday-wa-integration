const axios = require('axios');
const initMondayClient = require('monday-sdk-js');

const getColumnValue = async (token, itemId, columnId) => {
  try {
    const mondayClient = initMondayClient();
    mondayClient.setToken(token);
    mondayClient.setApiVersion('2024-04');

    const query = `query($itemId: [ID!], $columnId: [String!]) {
        items (ids: $itemId) {
          column_values(ids:$columnId) {
            value
          }
        }
      }`;
    const variables = { itemId, columnId };

    const response = await mondayClient.api(query, { variables });
    console.log(response, 'response');
    return response.data.items[0].column_values[0].value;
  } catch (err) {
    console.error(err);
  }
};

const getPhoneValue = async (token, itemId, columnId) => {
  try {
    const mondayClient = initMondayClient();
    mondayClient.setToken(token);
    mondayClient.setApiVersion("2024-01");

    const query = `query($itemId: [ID!], $columnId: [String!]) {
      items (ids: $itemId) {
        column_values(ids: $columnId) {
          value
        }
      }
    }`;

    const variables = { itemId, columnId };

    const response = await mondayClient.api(query, { variables });
    console.log(response, 'response');

    const valueString = response.data.items[0].column_values[0].value;
    const phoneValue = JSON.parse(valueString);

    return {
      country_short_name: phoneValue.countryShortName,
      phone: phoneValue.phone
    };
  } catch (err) {
    console.error(err);
  }
};

const changeColumnValue = async (token, boardId, itemId, columnId, value) => {
  try {
    const mondayClient = initMondayClient();
    mondayClient.setToken(token);
    mondayClient.setApiVersion("2024-01");

    const query = `mutation change_column_value($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
        change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
          id
        }
      }`;
    const variables = { boardId, columnId, itemId, value };

    const response = await mondayClient.api(query, { variables });
    console.log(response, 'response');
    return response;
  } catch (err) {
    console.error(err);
  }
};

const createNewItem = async (boardId, groupId, itemName, phoneNumber) => {
  try {
    const mondayClient = initMondayClient();
    mondayClient.setToken(process.env.API_TOKEN);
    mondayClient.setApiVersion("2024-01");

      const query = `
      mutation createNewItem($boardId: ID!, $groupId: String!, $itemName: String!) {
        create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName) {
          id
        }
      }`;

    const variables = {
      boardId: boardId,
      groupId: groupId,
      itemName: itemName
    };

    const response = await mondayClient.api(query, { variables });
    const phoneValue = {
      phone: phoneNumber,
      countryShortName: "ID"
    }
    const stringifyPhoneValue = JSON.stringify(phoneValue)
    await changeColumnValue(process.env.API_TOKEN, boardId, response.data.create_item.id, "phone", stringifyPhoneValue)
    return response;
  } catch (err) {
    console.error("Error is: ", err);
  }
};

const changeStatusColumnValue = async (token, boardId, itemId, columnId, statusColumnValue) => {
  try {
    const mondayClient = initMondayClient();
    mondayClient.setToken(token);
    mondayClient.setApiVersion("2024-01");

    const query = `mutation change_column_value($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
        id
      }
    }`;
    const variables = {
      boardId,
      itemId,
      columnId,
      value: JSON.stringify({ index: statusColumnValue.index })
    };

    console.log('changeStatusColumnValue variables:', variables);

    const response = await mondayClient.api(query, { variables });
    console.log('changeStatusColumnValue response:', response);
    return response;
  } catch (err) {
    console.error('changeStatusColumnValue error:', err);
  }
};

const getColumnValues = async (token, itemId) => {
  try {
    const mondayClient = initMondayClient();
    mondayClient.setToken(token);
    mondayClient.setApiVersion('2024-04');

    const query = `query($itemId: [ID!]) {
      items (ids: $itemId) {
        column_values {
          title
          value
        }
      }
    }`;
    const variables = { itemId };

    const response = await mondayClient.api(query, { variables });
    console.log(response, 'response');
    return response.data.items[0].column_values;
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  getColumnValue,
  changeColumnValue,
  getPhoneValue,
  createNewItem,
  changeStatusColumnValue,
  getColumnValues
};
