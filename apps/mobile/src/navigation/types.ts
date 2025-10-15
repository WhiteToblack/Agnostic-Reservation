import type { SessionResume } from '../../../shared/types/auth';

export type RootStackParamList = {
  Bootstrap: undefined;
  Onboarding: { deviceId: string };
  SessionResume: { session: SessionResume; deviceId: string };
  SignIn: { deviceId: string } | undefined;
  SignUp: { deviceId: string } | undefined;
  Main: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Reservations: undefined;
  Admin: undefined;
};
