// Item delivery orders — Hay Day style "bring X items for reward"
// Orders refresh each game day, 2-3 active at a time

const ORDER_TEMPLATES = [
  // Food chain
  { items: [{ id: 'food_1', qty: 2 }], reward: 6, label: 'Stelle 2x Krümel her' },
  { items: [{ id: 'food_2', qty: 1 }], reward: 8, label: 'Stelle 1x Leckerli her' },
  { items: [{ id: 'food_2', qty: 2 }], reward: 14, label: 'Stelle 2x Leckerli her' },
  { items: [{ id: 'food_3', qty: 1 }], reward: 15, label: 'Stelle 1x Futternapf her' },
  { items: [{ id: 'food_1', qty: 3 }, { id: 'toy_1', qty: 1 }], reward: 10, label: 'Merge 3x Krümel + 1x Faden' },
  // Toy chain
  { items: [{ id: 'toy_1', qty: 2 }], reward: 6, label: 'Stelle 2x Faden her' },
  { items: [{ id: 'toy_2', qty: 1 }], reward: 8, label: 'Stelle 1x Ball her' },
  { items: [{ id: 'toy_2', qty: 2 }], reward: 14, label: 'Stelle 2x Ball her' },
  { items: [{ id: 'toy_3', qty: 1 }], reward: 15, label: 'Stelle 1x Plüschtier her' },
  // Bed chain
  { items: [{ id: 'bed_1', qty: 2 }], reward: 6, label: 'Stelle 2x Decke her' },
  { items: [{ id: 'bed_2', qty: 1 }], reward: 8, label: 'Stelle 1x Kissen her' },
  { items: [{ id: 'bed_1', qty: 2 }, { id: 'hyg_1', qty: 2 }], reward: 10, label: 'Merge 2x Decke + 2x Wasser' },
  // Medicine chain
  { items: [{ id: 'med_1', qty: 2 }], reward: 6, label: 'Stelle 2x Pflaster her' },
  { items: [{ id: 'med_2', qty: 1 }], reward: 8, label: 'Stelle 1x Salbe her' },
  { items: [{ id: 'med_1', qty: 3 }, { id: 'med_2', qty: 1 }], reward: 15, label: 'Merge 3x Pflaster + 1x Salbe' },
  // Hygiene chain
  { items: [{ id: 'hyg_1', qty: 2 }], reward: 6, label: 'Stelle 2x Wasser her' },
  { items: [{ id: 'hyg_2', qty: 1 }], reward: 8, label: 'Stelle 1x Seife her' },
  { items: [{ id: 'hyg_2', qty: 2 }], reward: 14, label: 'Stelle 2x Seife her' },
  // Mixed (higher value)
  { items: [{ id: 'food_2', qty: 1 }, { id: 'toy_2', qty: 1 }], reward: 18, label: 'Merge 1x Leckerli + 1x Ball' },
  { items: [{ id: 'bed_2', qty: 1 }, { id: 'med_2', qty: 1 }], reward: 18, label: 'Merge 1x Kissen + 1x Salbe' },
  { items: [{ id: 'food_3', qty: 1 }, { id: 'hyg_2', qty: 1 }], reward: 22, label: 'Merge 1x Futternapf + 1x Seife' },
  { items: [{ id: 'food_1', qty: 2 }, { id: 'toy_1', qty: 2 }, { id: 'bed_1', qty: 2 }], reward: 15, label: 'Merge je 2x Krümel, Faden & Decke' },
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
    // Track progress: how many of each item have been merged SINCE order was created
    progress: t.items.map(() => 0),
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

// Called when a merge produces a new item — check if any order needs it
export function onItemMerged(save, itemId) {
  if (!save.orders || !save.orders.list) return;
  save.orders.list.forEach(order => {
    if (order.fulfilled) return;
    order.items.forEach((req, idx) => {
      if (req.id === itemId && order.progress[idx] < req.qty) {
        order.progress[idx]++;
      }
    });
  });
}

// Check if an order is complete (all items merged since order was posted)
export function isOrderComplete(order) {
  return order.items.every((req, idx) => order.progress[idx] >= req.qty);
}
