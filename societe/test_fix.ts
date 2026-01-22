// Test de structure correcte pour les tickets

const generateMockTickets = (): any[] => [
  // Trip 1 - structure correcte
  ...Array.from({ length: 33 }, (_, i: number) => ({
    id: `ticket_today_1_${i + 1}`,
    tripId: 'trip_today_1',
    price: 5000,
    paymentMethod: 'mobile_money' as const,
    salesChannel: Math.random() > 0.8 ? 'online' : 'counter' as const,
  })),

  // Trip 2 - structure correcte
  ...Array.from({ length: 18 }, (_, i: number) => ({
    id: `ticket_today_2_${i + 1}`,
    tripId: 'trip_today_2',
    price: 2000,
    paymentMethod: 'mobile_money' as const,
    salesChannel: Math.random() > 0.7 ? 'online' : 'counter' as const,
  })),
];
