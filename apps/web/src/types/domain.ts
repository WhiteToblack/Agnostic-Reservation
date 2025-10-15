export type ContactInformation = {
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode: string;
};

export type BillingInformation = {
  cardHolderName: string;
  cardBrand: string;
  cardLast4: string;
  expiryMonth: string;
  expiryYear: string;
  billingAddress: string;
  billingCity: string;
  billingCountry: string;
  billingPostalCode: string;
};

export type SupportInteractionStatus = 'Alındı' | 'Yanıtlandı' | 'Çözüldü';

export type SupportInteraction = {
  id: string;
  subject: string;
  summary: string;
  status: SupportInteractionStatus;
  channel: 'Portal' | 'E-posta' | 'Telefon' | 'Canlı Sohbet';
  createdAt: string;
};

export type RegisteredUser = {
  fullName: string;
  email: string;
  password: string;
  tenantId: string;
  role: 'admin' | 'company' | 'user';
  contact: ContactInformation;
  billing: BillingInformation;
  supportHistory: SupportInteraction[];
  tags?: string[];
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
