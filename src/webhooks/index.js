const fetch = require('node-fetch');

// Directly set your API token here for testing purposes
const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM4MTI3NzcwMiwiYWFpIjoxMSwidWlkIjo2MTY1ODc2NiwiaWFkIjoiMjAyNC0wNy0wOFQwMzo1NDozMi4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MjI4NTIwMzYsInJnbiI6ImFwc2UyIn0.Ne4peLuXKBmwCmht06FvnV19cCVFDofTNH2wMMu9SBM';

// Query to return a list of boards
// let query = '{ boards (limit:5) {name id} }';

// fetch("https://api.monday.com/v2", {
//     method: 'post',
//     headers: {
//         'Content-Type': 'application/json',
//         'Authorization': API_TOKEN,
//     },
//     body: JSON.stringify({
//         'query': query
//     })
// })
//   .then(res => res.json())
//   .then(res => console.log(JSON.stringify(res, null, 2)))
//   .catch(err => console.error('Error:', err));


// Query 2: return items and column data for a single board
let query2 = `{
    boards(limit:1) {
      name
      id
      description
      items_page(limit: 100) {
        items {
          name
          column_values(limit:5) {
            id
            type
            text
          }
        }
      }
    }
  }`;
  

fetch ("https://api.monday.com/v2", {
  method: 'post',
  headers: {
    'Content-Type': 'application/json',
    'Authorization' : API_TOKEN,
  },
  body: JSON.stringify({
    'query' : query2.replace("BOARD_ID", "YOUR_ACTUAL_BOARD_ID")
  })
})
.then(res => res.json())
.then(res => console.log(JSON.stringify(res, null, 2)));
