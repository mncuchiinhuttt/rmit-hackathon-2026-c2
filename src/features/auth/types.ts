export interface SessionView {
  sub: string;
  username: string;
  tideUserKey: string;
  realmRoles: string[];
  isSteward: boolean;
  canEncrypt: boolean;
  canDecrypt: boolean;
}

export interface CircleMember {
  sub: string;
  username: string;
  tideUserKey: string;
}

export interface TideSessionState {
  authenticated: boolean;
  initializing: boolean;
  error: string | null;
  username: string;
  isSteward: boolean;
  canEncrypt: boolean;
  canDecrypt: boolean;
  login(): Promise<void>;
  logout(): Promise<void>;
}
