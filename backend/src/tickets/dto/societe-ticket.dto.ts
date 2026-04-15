export class CreateSocieteTicketDto {
  tripId: string;
  operatorId?: string;
  passengerName: string;
  passengerPhone?: string;
  passengerEmail?: string;
  seatNumber?: string;
  price: number;
  paymentMethod?: string;
  salesChannel?: string;
  cashierId?: string;
  cashierName?: string;
  gareId?: string;
}

export class UpdateTicketDto {
  passengerName?: string;
  passengerPhone?: string;
  seatNumber?: string;
  status?: string;
  price?: number;
}
