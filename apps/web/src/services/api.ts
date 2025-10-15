import axios from 'axios';
import { appConfig } from '../config/appConfig';
import type { AuthResult, SessionResume } from '../../../shared/types/auth';

export type SignInPayload = {
  tenantId: string;
  email: string;
  password: string;
  deviceId: string;
  shopId?: string;
  shopName?: string;
  shopTimeZone?: string;
};

export type SignUpPayload = SignInPayload & {
  fullName: string;
  preferredTheme: string;
  preferredLanguage?: string;
  acceptKvkk?: boolean;
};

export type SignOutPayload = {
  tenantId: string;
  userId: string;
  deviceId: string;
};

export type UserProfile = {
  userId: string;
  tenantId: string;
  email: string;
  fullName: string;
  preferredTheme: string;
  preferredLanguage: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  country: string;
  postalCode: string;
  billingName: string;
  billingTaxNumber: string;
  billingAddress: string;
  billingCity: string;
  billingCountry: string;
  billingPostalCode: string;
};

export type UpdateUserProfilePayload = Partial<Pick<UserProfile, 'fullName' | 'preferredTheme' | 'preferredLanguage' | 'phoneNumber' | 'addressLine1' | 'addressLine2' | 'city' | 'country' | 'postalCode' | 'billingName' | 'billingTaxNumber' | 'billingAddress' | 'billingCity' | 'billingCountry' | 'billingPostalCode'>>;

export type ResourceDto = {
  id: string;
  tenantId: string;
  name: string;
  capacity: number;
};

export type ReservationSummaryDto = {
  id: string;
  resourceId: string;
  resourceName: string;
  startUtc: string;
  endUtc: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
};

export type ReservationTimelinePoint = {
  date: string;
  count: number;
};

export type UserReservationsOverview = {
  reservations: ReservationSummaryDto[];
  timeline: ReservationTimelinePoint[];
};

export type SupportTicketDto = {
  id: string;
  tenantId: string;
  userId: string;
  subject: string;
  summary: string | null;
  status: string;
  channel: string;
  createdAt: string;
  updatedAt?: string | null;
};

const client = axios.create({
  baseURL: appConfig.apiBaseUrl,
});

const mapSignUpPayload = (payload: SignUpPayload) => ({
  tenantId: payload.tenantId,
  email: payload.email,
  password: payload.password,
  fullName: payload.fullName,
  preferredTheme: payload.preferredTheme,
  preferredLanguage: payload.preferredLanguage ?? 'tr-TR',
  acceptKvkk: payload.acceptKvkk ?? true,
  deviceId: payload.deviceId,
  shopId: payload.shopId,
  shopName: payload.shopName,
  shopTimeZone: payload.shopTimeZone,
});

export const signIn = (payload: SignInPayload) => client.post<AuthResult>('/auth/signin', payload).then((response) => response.data);

export const signUp = (payload: SignUpPayload) =>
  client.post<AuthResult>('/auth/signup', mapSignUpPayload(payload)).then((response) => response.data);

export const signOut = (payload: SignOutPayload) => client.post('/auth/signout', payload);

export const resumeSession = (tenantId: string, deviceId: string) =>
  client.get<SessionResume>('/auth/session', { params: { tenantId, deviceId } }).then((response) => response.data);

export const fetchUserProfile = (userId: string) => client.get<UserProfile>(`/users/${userId}`).then((response) => response.data);

export const updateUserProfile = (userId: string, payload: UpdateUserProfilePayload) =>
  client.put<UserProfile>(`/users/${userId}`, payload).then((response) => response.data);

export const fetchResources = (tenantId: string) =>
  client.get<ResourceDto[]>('/resources', { params: { tenantId } }).then((response) => response.data);

export const fetchUserReservations = (tenantId: string, userId: string, range?: { startUtc?: string; endUtc?: string }) =>
  client
    .get<UserReservationsOverview>('/reservations/user', {
      params: { tenantId, userId, startUtc: range?.startUtc, endUtc: range?.endUtc },
    })
    .then((response) => response.data);

export const createReservation = (payload: { tenantId: string; resourceId: string; userId: string; startUtc: string; endUtc: string }) =>
  client.post('/reservations', payload).then((response) => response.data);

export const updateReservation = (payload: { reservationId: string; tenantId: string; startUtc?: string; endUtc?: string; status?: string }) =>
  client.put(`/reservations/${payload.reservationId}`, payload).then((response) => response.data);

export const deleteReservation = (reservationId: string, tenantId: string) =>
  client.delete(`/reservations/${reservationId}`, { params: { tenantId } });

export const fetchSupportTickets = (tenantId: string, userId?: string) =>
  client
    .get<SupportTicketDto[]>('/support-tickets', { params: { tenantId, userId } })
    .then((response) => response.data);

export const createSupportTicket = (payload: {
  tenantId: string;
  userId: string;
  subject: string;
  summary?: string;
  status?: string;
  channel?: string;
}) => client.post<SupportTicketDto>('/support-tickets', payload).then((response) => response.data);

export const updateSupportTicket = (
  ticketId: string,
  payload: { tenantId: string; subject?: string; summary?: string | null; status?: string; channel?: string }
) => client.put<SupportTicketDto>(`/support-tickets/${ticketId}`, payload).then((response) => response.data);

export const deleteSupportTicket = (ticketId: string, tenantId: string) =>
  client.delete(`/support-tickets/${ticketId}`, { params: { tenantId } });
