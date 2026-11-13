const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`High Ticket Clients running at http://localhost:${PORT}`);
});
