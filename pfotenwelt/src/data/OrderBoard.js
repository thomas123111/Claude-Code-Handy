// Item delivery orders — Hay Day style "bring X items for reward"
// Orders refresh each game day, 2-3 active at a time

const ORDER_TEMPLATES = [
  // Food chain orders
  { items: [{ id: 'food_1', qty: 2 }], reward: 6, label: '2x Krümel liefern' },
  { items: [{ id: 'food_2', qty: 1 }], reward: 8, label: '1x Leckerli liefern' },
  { items: [{ id: 'food_2', qty: 2 }], reward: 14, label: '2x Leckerli liefern' },
  { items: [{ id: 'food_3', qty: 1 }], reward: 15, label: '1x Futternapf liefern' },
  { items: [{ id: 'food_1', qty: 3 }, { id: 'toy_1', qty: 1 }], reward: 10, label: '3x Krümel + 1x Faden' },
  // Toy chain orders
  { items: [{ id: 'toy_1', qty: 2 }], reward: 6, label: '2x Faden liefern' },
  { items: [{ id: 'toy_2', qty: 1 }], reward: 8, label: '1x Ball liefern' },
  { items: [{ id: 'toy_2', qty: 2 }], reward: 14, label: '2x Ball liefern' },
  { items: [{ id: 'toy_3', qty: 1 }], reward: 15, label: '1x Plüschtier liefern' },
  // Bed chain orders
  { items: [{ id: 'bed_1', qty: 2 }], reward: 6, label: '2x Decke liefern' },
  { items: [{ id: 'bed_2', qty: 1 }], reward: 8, label: '1x Kissen liefern' },
  { items: [{ id: 'bed_1', qty: 2 }, { id: 'hyg_1', qty: 2 }], reward: 10, label: '2x Decke + 2x Wasser' },
  // Medicine chain orders
  { items: [{ id: 'med_1', qty: 2 }], reward: 6, label: '2x Pflaster liefern' },
  { items: [{ id: 'med_2', qty: 1 }], reward: 8, label: '1x Salbe liefern' },
  { items: [{ id: 'med_1', qty: 3 }, { id: 'med_2', qty: 1 }], reward: 15, label: '3x Pflaster + 1x Salbe' },
  // Hygiene chain orders
  { items: [{ id: 'hyg_1', qty: 2 }], reward: 6, label: '2x Wasser liefern' },
  { items: [{ id: 'hyg_2', qty: 1 }], reward: 8, label: '1x Seife liefern' },
  { items: [{ id: 'hyg_2', qty: 2 }], reward: 14, label: '2x Seife liefern' },
  // Mixed orders (higher value)
  { items: [{ id: 'food_2', qty: 1 }, { id: 'toy_2', qty: 1 }], reward: 18, label: '1x Leckerli + 1x Ball' },
  { items: [{ id: 'bed_2', qty: 1 }, { id: 'med_2', qty: 1 }], reward: 18, label: '1x Kissen + 1x Salbe' },
  { items: [{ id: 'food_3', qty: 1 }, { id: 'hyg_2', qty: 1 }], reward: 22, label: '1x Futternapf + 1x Seife' },
  { items: [{ id: 'food_1', qty: 2 }, { id: 'toy_1', qty: 2 }, { id: 'bed_1', qty: 2 }], reward: 15, label: '2x Krümel + 2x Faden + 2x Decke' },
];

// Generate 2-3 orders for a game day
export function generateOrders(gameDay) {
  const seed = gameDay * 13337;
  const shuffled = [...ORDER_TEMPLATES].sort((a, b) => {
    return ((seed + a.label.charCodeAt(0) * 47) % 1000) - ((seed + b.label.charCodeAt(0) * 47) % 1000);
  });
  const count = (gameDay % 3 === 0) ? 3 : 2;
  return shuffled.slice(0, count).map((t, i) => ({
    ...t,
    id: `order_${gameDay}_${i}`,
    fulfilled: false,
  }));
}

// Refresh orders in save
export function refreshOrders(save) {
  if (!save.orders || save.orders.day !== save.gameDay) {
    save.orders = {
      day: save.gameDay,
      list: generateOrders(save.gameDay),
    };
  }
  return save.orders;
}

// Check if player has items on merge board to fulfill an order
export function canFulfillOrder(order, board) {
  if (!board) return false;
  // Count items on board by ID
  const counts = {};
  for (const row of board) {
    for (const cell of row) {
      if (cell) counts[cell] = (counts[cell] || 0) + 1;
    }
  }
  return order.items.every(req => (counts[req.id] || 0) >= req.qty);
}

// Remove items from board to fulfill order
export function fulfillOrder(order, board) {
  for (const req of order.items) {
    let remaining = req.qty;
    for (let r = 0; r < board.length && remaining > 0; r++) {
      for (let c = 0; c < board[r].length && remaining > 0; c++) {
        if (board[r][c] === req.id) {
          board[r][c] = null;
          remaining--;
        }
      }
    }
  }
}
