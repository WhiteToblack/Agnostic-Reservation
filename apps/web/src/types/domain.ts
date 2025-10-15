export type RegisteredUser = {
  fullName: string;
  email: string;
  password: string;
  tenantId: string;
};

export type ReservationStatus = 'Onaylandı' | 'Beklemede' | 'İptal';

export type Reservation = {
  id: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  status: ReservationStatus;
  totalPrice: number;
  channel: string;
  notes?: string;
};
