const Settings = require('../models/Settings');

// Generates e.g. ORD-1001, ORD-1002 ...
async function nextOrderNumber() {
  const settings = await Settings.findOneAndUpdate(
    {},
    { $inc: { billNumberCounter: 1 } },
    { new: true, upsert: true }
  );
  const prefix = settings.billNumberPrefix || 'ORD';
  return `${prefix}-${settings.billNumberCounter}`;
}

// Bill numbers reuse the same counter but are suffixed by copy type so all 4
// copies of one order share the same order number while having unique billNumbers.
function billNumberFor(orderNumber, copyLabel) {
  const map = {
    'Customer Copy': 'C',
    'Shop Copy': 'S',
    'Tailor/Cutting Copy': 'T',
    'Delivery Copy': 'D',
  };
  return `${orderNumber}-${map[copyLabel] || 'X'}`;
}

module.exports = { nextOrderNumber, billNumberFor };
