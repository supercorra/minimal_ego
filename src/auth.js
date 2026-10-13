// Espone al browser le funzioni di Netlify Identity usate da index.html.
import {
  AuthError,
  MissingIdentityError,
  acceptInvite,
  getUser,
  handleAuthCallback,
  login,
  logout,
  onAuthChange,
  requestPasswordRecovery,
  signup,
  updateUser,
} from "@netlify/identity";

window.MinimalEgoAuth = {
  AuthError,
  MissingIdentityError,
  acceptInvite,
  getUser,
  handleAuthCallback,
  login,
  logout,
  onAuthChange,
  requestPasswordRecovery,
  signup,
  updateUser,
};
